"""
Legal AI Service for Client Validation
Validates client form submissions for completeness and legal compliance
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Tuple

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LegalAIService:
    """AI-powered service for validating client form submissions"""
    
    def __init__(self):
        self.validation_rules = {
            'required_fields': ['name', 'company'],
            'email_pattern': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
            'phone_pattern': r'^[\+]?[1-9][\d]{0,15}$',
            'name_min_length': 2,
            'company_min_length': 2
        }
    
    def validate_client_submission(self, client_data: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validate client form submission using AI analysis
        
        Args:
            client_data: Dictionary containing client form data
            
        Returns:
            Tuple of (is_valid, message, analysis_details)
        """
        try:
            logger.info(f"[LEGAL AI] Starting validation for client: {client_data.get('name', 'Unknown')}")
            
            # Step 1: Basic field validation
            basic_validation = self._validate_basic_fields(client_data)
            if not basic_validation['is_valid']:
                return False, basic_validation['message'], basic_validation
            
            # Step 2: Content quality analysis
            content_analysis = self._analyze_content_quality(client_data)
            if not content_analysis['is_valid']:
                return False, content_analysis['message'], content_analysis
            
            # Step 3: Legal compliance check
            compliance_check = self._check_legal_compliance(client_data)
            if not compliance_check['is_valid']:
                return False, compliance_check['message'], compliance_check
            
            # Step 4: Risk assessment
            risk_assessment = self._assess_risk_factors(client_data)
            
            # Compile final analysis
            analysis_details = {
                'basic_validation': basic_validation,
                'content_analysis': content_analysis,
                'compliance_check': compliance_check,
                'risk_assessment': risk_assessment,
                'overall_score': self._calculate_overall_score(basic_validation, content_analysis, compliance_check),
                'validation_timestamp': datetime.utcnow().isoformat(),
                'ai_recommendations': self._generate_recommendations(client_data, risk_assessment)
            }
            
            logger.info(f"[LEGAL AI] Validation completed successfully for: {client_data.get('name')}")
            return True, "Client submission is valid and compliant", analysis_details
            
        except Exception as e:
            logger.error(f"[LEGAL AI] Validation error: {str(e)}")
            return False, f"Validation failed due to system error: {str(e)}", {}
    
    def _validate_basic_fields(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate basic required fields and formats"""
        errors = []
        warnings = []
        
        # Check required fields
        for field in self.validation_rules['required_fields']:
            if not data.get(field) or not str(data.get(field)).strip():
                errors.append(f"'{field}' is required and cannot be empty")
        
        # Validate email format
        email = data.get('email', '').strip()
        if email:
            import re
            if not re.match(self.validation_rules['email_pattern'], email):
                errors.append("Email format is invalid")
        
        # Validate phone format if provided
        phone = data.get('phone', '').strip()
        if phone:
            import re
            cleaned_phone = re.sub(r'[\s\-\(\)]', '', phone)
            if not re.match(self.validation_rules['phone_pattern'], cleaned_phone):
                warnings.append("Phone number format may be invalid")
        
        # Validate name length
        name = data.get('name', '').strip()
        if name and len(name) < self.validation_rules['name_min_length']:
            errors.append(f"Client name must be at least {self.validation_rules['name_min_length']} characters")
        
        # Validate company length
        company = data.get('company', '').strip()
        if company and len(company) < self.validation_rules['company_min_length']:
            errors.append(f"Company name must be at least {self.validation_rules['company_min_length']} characters")
        
        return {
            'is_valid': len(errors) == 0,
            'message': '; '.join(errors) if errors else 'Basic validation passed',
            'errors': errors,
            'warnings': warnings,
            'score': 100 if len(errors) == 0 else max(0, 100 - (len(errors) * 25))
        }
    
    def _analyze_content_quality(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze the quality and completeness of provided information"""
        quality_score = 100
        suggestions = []
        flags = []
        
        # Check for professional email domains
        email = data.get('email', '').lower()
        if email:
            suspicious_domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
            domain = email.split('@')[-1] if '@' in email else ''
            if domain in suspicious_domains:
                quality_score -= 10
                suggestions.append("Consider using a business email address for professional communication")
        
        # Check company name completeness
        company = data.get('company', '').strip()
        if company:
            if len(company) < 3:
                quality_score -= 20
                flags.append("Company name appears too short")
            elif company.lower() in ['test', 'demo', 'sample', 'example']:
                quality_score -= 30
                flags.append("Company name appears to be placeholder text")
        
        # Check name completeness
        name = data.get('name', '').strip()
        if name:
            if len(name.split()) < 2:
                quality_score -= 10
                suggestions.append("Full name (first and last) is recommended")
            elif name.lower() in ['test', 'demo', 'sample', 'admin']:
                quality_score -= 25
                flags.append("Name appears to be placeholder text")
        
        # Check for additional information completeness
        if not data.get('phone'):
            quality_score -= 5
            suggestions.append("Phone number would improve contact options")
        
        return {
            'is_valid': quality_score >= 70,  # Minimum threshold
            'message': 'Content quality analysis passed' if quality_score >= 70 else 'Content quality below acceptable threshold',
            'quality_score': quality_score,
            'suggestions': suggestions,
            'flags': flags
        }
    
    def _check_legal_compliance(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Check for legal compliance and potential red flags"""
        compliance_score = 100
        violations = []
        warnings = []
        
        # Check for potentially problematic names/companies
        problematic_keywords = [
            'illegal', 'fraud', 'scam', 'money laundering', 'tax evasion',
            'offshore', 'shell company', 'cryptocurrency mining', 'ponzi',
            'pyramid scheme', 'adult entertainment', 'gambling', 'weapons',
            'drugs', 'narcotics', 'tobacco'
        ]
        
        name = data.get('name', '').lower()
        company = data.get('company', '').lower()
        
        for keyword in problematic_keywords:
            if keyword in name or keyword in company:
                compliance_score -= 50
                violations.append(f"Potential compliance issue: '{keyword}' detected")
        
        # Check email domain reputation (basic check)
        email = data.get('email', '').lower()
        if email:
            suspicious_email_patterns = ['tempmail', 'throwaway', '10minute', 'guerrilla']
            for pattern in suspicious_email_patterns:
                if pattern in email:
                    compliance_score -= 30
                    warnings.append("Temporary email service detected")
        
        # Check for data completeness for compliance
        if not data.get('company'):
            compliance_score -= 15
            warnings.append("Missing company information may affect compliance verification")
        
        return {
            'is_valid': compliance_score >= 60,  # Compliance threshold
            'message': 'Legal compliance check passed' if compliance_score >= 60 else 'Legal compliance issues detected',
            'compliance_score': compliance_score,
            'violations': violations,
            'warnings': warnings
        }
    
    def _assess_risk_factors(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess overall risk factors for the client"""
        risk_level = 'LOW'
        risk_factors = []
        mitigation_steps = []
        
        # Email-based risk assessment
        email = data.get('email', '').lower()
        if email:
            if any(domain in email for domain in ['gmail.com', 'yahoo.com', 'hotmail.com']):
                risk_factors.append("Personal email domain used")
                mitigation_steps.append("Request business email verification")
        
        # Company information risk
        company = data.get('company', '').strip()
        if not company or len(company) < 3:
            risk_factors.append("Insufficient company information")
            mitigation_steps.append("Require detailed company information")
        
        # Phone number risk
        if not data.get('phone'):
            risk_factors.append("No phone number provided")
            mitigation_steps.append("Request phone number for verification")
        
        # Determine overall risk level
        if len(risk_factors) >= 3:
            risk_level = 'HIGH'
        elif len(risk_factors) >= 1:
            risk_level = 'MEDIUM'
        
        return {
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'mitigation_steps': mitigation_steps,
            'recommendation': self._get_risk_recommendation(risk_level)
        }
    
    def _calculate_overall_score(self, basic_val: Dict, content_anal: Dict, compliance: Dict) -> int:
        """Calculate overall validation score"""
        weights = {'basic': 0.4, 'content': 0.3, 'compliance': 0.3}
        
        overall_score = (
            basic_val.get('score', 0) * weights['basic'] +
            content_anal.get('quality_score', 0) * weights['content'] +
            compliance.get('compliance_score', 0) * weights['compliance']
        )
        
        return int(overall_score)
    
    def _generate_recommendations(self, data: Dict[str, Any], risk_assessment: Dict) -> list:
        """Generate AI recommendations for the client submission"""
        recommendations = []
        
        # Risk-based recommendations
        if risk_assessment['risk_level'] == 'HIGH':
            recommendations.append("Conduct additional verification before approval")
            recommendations.append("Consider requiring additional documentation")
        elif risk_assessment['risk_level'] == 'MEDIUM':
            recommendations.append("Standard verification procedures recommended")
        
        # Data quality recommendations
        if not data.get('phone'):
            recommendations.append("Request phone number for better communication")
        
        if data.get('email', '').endswith(('@gmail.com', '@yahoo.com', '@hotmail.com')):
            recommendations.append("Consider requesting business email address")
        
        # General recommendations
        recommendations.append("Review all provided information before final approval")
        recommendations.append("Consider setting up initial consultation meeting")
        
        return recommendations
    
    def _get_risk_recommendation(self, risk_level: str) -> str:
        """Get recommendation based on risk level"""
        recommendations = {
            'LOW': 'Low risk client - proceed with standard approval process',
            'MEDIUM': 'Medium risk client - additional verification recommended',
            'HIGH': 'High risk client - thorough review and documentation required'
        }
        return recommendations.get(risk_level, 'Unknown risk level')

# Singleton instance
legal_ai_service = LegalAIService()
