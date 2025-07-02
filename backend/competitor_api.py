"""
Competitor tracking API endpoints
"""
from flask import Blueprint, request, jsonify
from models import db, ClientCompetitor, CompetitorSnapshot, CompetitorBenchmark, Client
from datetime import datetime, date, timedelta
import re

competitor_bp = Blueprint('competitor', __name__)

def validate_handle(handle):
    """Validate social media handle format"""
    # Remove @ if present
    handle = handle.lstrip('@')
    # Check if handle is valid (alphanumeric, underscores, dots)
    if not re.match(r'^[a-zA-Z0-9._]{1,30}$', handle):
        return False, "Invalid handle format"
    return True, handle

@competitor_bp.route('/api/clients/<int:client_id>/competitors', methods=['POST'])
def add_competitor(client_id):
    """Add a competitor to client's tracking list"""
    try:
        data = request.get_json()
        handle = data.get('handle', '').strip()
        platform = data.get('platform', '').lower()
        display_name = data.get('display_name', '')
        
        # Validation
        if not handle or not platform:
            return jsonify({'error': 'Handle and platform are required'}), 400
            
        if platform not in ['tiktok', 'instagram']:
            return jsonify({'error': 'Platform must be tiktok or instagram'}), 400
            
        is_valid, clean_handle = validate_handle(handle)
        if not is_valid:
            return jsonify({'error': clean_handle}), 400
            
        # Check if client exists
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'error': 'Client not found'}), 404
            
        # Check for duplicates
        existing = ClientCompetitor.query.filter_by(
            client_id=client_id,
            handle=clean_handle,
            platform=platform
        ).first()
        
        if existing:
            if existing.is_active:
                return jsonify({'error': 'Competitor already tracked'}), 409
            else:
                # Reactivate existing competitor
                existing.is_active = True
                db.session.commit()
                return jsonify({
                    'message': 'Competitor reactivated',
                    'competitor': {
                        'id': existing.id,
                        'handle': existing.handle,
                        'platform': existing.platform,
                        'display_name': existing.display_name,
                        'created_at': existing.created_at.isoformat()
                    }
                }), 200
        
        # Create new competitor
        competitor = ClientCompetitor(
            client_id=client_id,
            handle=clean_handle,
            platform=platform,
            display_name=display_name or clean_handle,
            added_by=1  # TODO: Get from session
        )
        
        db.session.add(competitor)
        db.session.commit()
        
        return jsonify({
            'message': 'Competitor added successfully',
            'competitor': {
                'id': competitor.id,
                'handle': competitor.handle,
                'platform': competitor.platform,
                'display_name': competitor.display_name,
                'created_at': competitor.created_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@competitor_bp.route('/api/clients/<int:client_id>/competitors', methods=['GET'])
def list_competitors(client_id):
    """List all tracked competitors for a client"""
    try:
        # Check if client exists
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'error': 'Client not found'}), 404
            
        competitors = ClientCompetitor.query.filter_by(
            client_id=client_id,
            is_active=True
        ).order_by(ClientCompetitor.created_at.desc()).all()
        
        result = []
        for comp in competitors:
            # Get latest snapshot for metrics
            latest_snapshot = CompetitorSnapshot.query.filter_by(
                handle=comp.handle,
                platform=comp.platform
            ).order_by(CompetitorSnapshot.snapshot_date.desc()).first()
            
            comp_data = {
                'id': comp.id,
                'handle': comp.handle,
                'platform': comp.platform,
                'display_name': comp.display_name,
                'created_at': comp.created_at.isoformat(),
                'latest_metrics': None
            }
            
            if latest_snapshot:
                comp_data['latest_metrics'] = {
                    'followers_count': latest_snapshot.followers_count,
                    'engagement_rate': latest_snapshot.engagement_rate,
                    'posts_count': latest_snapshot.posts_count,
                    'last_updated': latest_snapshot.snapshot_date.isoformat()
                }
                
            result.append(comp_data)
            
        return jsonify({
            'competitors': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@competitor_bp.route('/api/clients/<int:client_id>/competitors/<string:handle>', methods=['DELETE'])
def remove_competitor(client_id, handle):
    """Remove competitor from tracking (soft delete)"""
    try:
        platform = request.args.get('platform')
        if not platform:
            return jsonify({'error': 'Platform parameter required'}), 400
            
        competitor = ClientCompetitor.query.filter_by(
            client_id=client_id,
            handle=handle,
            platform=platform,
            is_active=True
        ).first()
        
        if not competitor:
            return jsonify({'error': 'Competitor not found'}), 404
            
        competitor.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Competitor removed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@competitor_bp.route('/api/clients/<int:client_id>/benchmarks', methods=['GET'])
def get_benchmarks(client_id):
    """Get competitor benchmarks for a client"""
    try:
        # Get date range (default: last 30 days)
        days = request.args.get('days', 30, type=int)
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Check if client exists
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'error': 'Client not found'}), 404
            
        # Get active competitors
        competitors = ClientCompetitor.query.filter_by(
            client_id=client_id,
            is_active=True
        ).all()
        
        if not competitors:
            return jsonify({
                'benchmarks': [],
                'summary': {
                    'total_competitors': 0,
                    'avg_follower_growth': 0,
                    'avg_engagement_rate': 0,
                    'top_performer': None
                }
            }), 200
            
        result = []
        growth_rates = []
        engagement_rates = []
        
        for comp in competitors:
            # Get recent snapshots for growth calculation
            snapshots = CompetitorSnapshot.query.filter(
                CompetitorSnapshot.handle == comp.handle,
                CompetitorSnapshot.platform == comp.platform,
                CompetitorSnapshot.snapshot_date >= start_date,
                CompetitorSnapshot.scrape_success == True
            ).order_by(CompetitorSnapshot.snapshot_date.desc()).limit(30).all()
            
            if not snapshots:
                continue
                
            latest = snapshots[0]
            
            # Calculate growth rate (compare with 7 days ago)
            growth_rate = 0
            if len(snapshots) > 7:
                week_ago = snapshots[7]
                if week_ago.followers_count > 0:
                    growth_rate = ((latest.followers_count - week_ago.followers_count) / week_ago.followers_count) * 100
                    
            growth_rates.append(growth_rate)
            engagement_rates.append(latest.engagement_rate)
            
            # Determine trending status (growth > 5% weekly)
            is_trending = growth_rate > 5.0
            
            benchmark_data = {
                'handle': comp.handle,
                'platform': comp.platform,
                'display_name': comp.display_name,
                'current_metrics': {
                    'followers_count': latest.followers_count,
                    'engagement_rate': latest.engagement_rate,
                    'posts_count': latest.posts_count,
                    'avg_likes': latest.avg_likes,
                    'avg_comments': latest.avg_comments
                },
                'growth_metrics': {
                    'follower_growth_rate': round(growth_rate, 2),
                    'is_trending': is_trending,
                    'posts_this_week': len([s for s in snapshots[:7] if s.posts_count > 0])
                },
                'last_updated': latest.snapshot_date.isoformat()
            }
            
            result.append(benchmark_data)
            
        # Calculate summary stats
        avg_growth = sum(growth_rates) / len(growth_rates) if growth_rates else 0
        avg_engagement = sum(engagement_rates) / len(engagement_rates) if engagement_rates else 0
        
        # Find top performer
        top_performer = None
        if result:
            top_performer = max(result, key=lambda x: x['growth_metrics']['follower_growth_rate'])
            
        return jsonify({
            'benchmarks': result,
            'summary': {
                'total_competitors': len(result),
                'avg_follower_growth': round(avg_growth, 2),
                'avg_engagement_rate': round(avg_engagement, 2),
                'top_performer': {
                    'handle': top_performer['handle'],
                    'growth_rate': top_performer['growth_metrics']['follower_growth_rate']
                } if top_performer else None,
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@competitor_bp.route('/api/competitors/all-handles', methods=['GET'])
def get_all_tracked_handles():
    """Get all unique competitor handles across all clients (for scraper)"""
    try:
        handles = db.session.query(
            ClientCompetitor.handle,
            ClientCompetitor.platform
        ).filter_by(is_active=True).distinct().all()
        
        result = [{'handle': h.handle, 'platform': h.platform} for h in handles]
        
        return jsonify({
            'handles': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
