import React from 'react';
import { Page, Text, View, Document, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#000',
    color: '#fff',
    padding: 32,
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: '#000',
    borderBottom: '4px solid #FFD600',
    paddingBottom: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  yellowAccent: {
    color: '#FFD600',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '2px solid #FFD600',
  },
  sectionTitle: {
    fontSize: 20,
    color: '#FFD600',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 14,
    color: '#FFD600',
  },
  kpiValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTop: '2px solid #FFD600',
    color: '#FFD600',
    fontSize: 12,
    textAlign: 'center',
  },
});

const NewsletterPDF = ({ userName, month, year, kpiData, campaigns, prCoverage, upcoming, insights, socialLinks }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Performance Recap</Text>
        <Text style={styles.yellowAccent}>{month} {year} Recap</Text>
        <Text style={{marginTop: 8}}>Hello {userName}, here’s your monthly performance recap!</Text>
      </View>
      {/* KPI Highlights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>KPI Highlights</Text>
        {kpiData.map((kpi, idx) => (
          <View style={styles.kpiRow} key={idx}>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
            <Text style={styles.kpiValue}>{kpi.value}</Text>
          </View>
        ))}
        {/* You can embed chart images here using <Image src={...} /> */}
      </View>
      {/* Campaign & Marketing Highlights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Campaign & Marketing Highlights</Text>
        {campaigns.map((c, idx) => (
          <Text key={idx} style={{marginBottom: 4}}>{c}</Text>
        ))}
      </View>
      {/* PR Coverage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PR Coverage</Text>
        {prCoverage.map((pr, idx) => (
          <Text key={idx} style={{marginBottom: 4}}>{pr}</Text>
        ))}
      </View>
      {/* Upcoming Plans */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Plans</Text>
        {upcoming.map((up, idx) => (
          <Text key={idx} style={{marginBottom: 4}}>{up}</Text>
        ))}
      </View>
      {/* Insights & Observations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insights & Observations</Text>
        {insights.map((ins, idx) => (
          <Text key={idx} style={{marginBottom: 4}}>{ins}</Text>
        ))}
      </View>
      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you, {userName}, for reviewing your monthly performance.</Text>
        <Text>Contact: info@yourcompany.com</Text>
        <Text>Social: {socialLinks.join(' | ')}</Text>
      </View>
    </Page>
  </Document>
);

export const NewsletterPDFDownload = (props) => (
  <PDFDownloadLink document={<NewsletterPDF {...props} />} fileName={`newsletter-${props.month}-${props.year}.pdf`}>
    {({ blob, url, loading, error }) =>
      loading ? 'Generating PDF...' : 'Download PDF'
    }
  </PDFDownloadLink>
);

export default NewsletterPDF;
