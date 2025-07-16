import pandas as pd
import json

# Create sample data with all 47 required columns
sample_data = {
    'reportDate': ['2025-07-15', '2025-07-14', '2025-07-13'],
    'registeredOnboarded': [15, 12, 10],
    'uniqueNationalityNonBahraini': [8, 7, 5],
    'linkedAccounts': [12, 10, 8],
    'totalAdvanceApplications': [25, 20, 18],
    'totalAdvanceApplicants': [20, 18, 15],
    'totalAdvanceDisbursed': [15, 12, 10],
    'totalAdvanceApproved': [18, 15, 12],
    'totalAdvanceExpired': [2, 1, 1],
    'advanceCaseLocked': [1, 1, 0],
    'totalAdvanceNotEligible': [3, 2, 2],
    'totalAdvanceRejection': [2, 1, 1],
    'totalAdvanceCancelByCustomer': [1, 1, 0],
    'viewedOfferAS': [20, 18, 15],
    'rejectionReasonAS': ['Risk Assessment', 'Incomplete Documents', 'Age Limit'],
    'totalMicroFinancingApplications': [30, 25, 22],
    'totalMicroFinancingApplicants': [25, 22, 18],
    'totalMicroDisbursed': [18, 15, 12],
    'totalMicroFinancingApproved': [22, 18, 15],
    'totalMicroExpired': [3, 2, 2],
    'microCaseLocked': [2, 1, 1],
    'totalMicroNotEligible': [4, 3, 3],
    'totalMicroRejection': [3, 2, 2],
    'totalMicroCancelByCustomer': [2, 1, 1],
    'rejectionReasonIF': ['Credit Score', 'Income Verification', 'Document Issues'],
    'totalCreditCardApplication': [20, 18, 15],
    'totalCreditCardApplicants': [18, 15, 12],
    'totalCreditCardDisbursed': [12, 10, 8],
    'totalCreditCardApproved': [15, 12, 10],
    'totalCreditCardExpired': [2, 1, 1],
    'creditCardCaseLocked': [1, 1, 0],
    'totalCreditCardNotEligible': [2, 2, 1],
    'totalCreditCardRejection': [1, 1, 1],
    'totalCreditCardCancelByCustomer': [1, 0, 0],
    'rejectionReasonCC': ['Credit History', 'Income Level', 'Age Requirement'],
    'totalPersonalFinanceApplication': [35, 30, 25],
    'totalPersonalFinanceApplicants': [30, 25, 20],
    'totalPersonalFinanceDisbursed': [22, 18, 15],
    'totalPersonalFinanceApproved': [25, 20, 18],
    'totalPersonalFinanceExpired': [3, 2, 2],
    'PersonalFinanceCaseLocked': [2, 1, 1],
    'totalPersonalFinanceNotEligible': [5, 4, 3],
    'totalPersonalFinanceRejection': [4, 3, 2],
    'totalPersonalFinanceCancelByCustomer': [2, 1, 1],
    'rejectionReasonPf': ['Employment Status', 'Salary Certificate', 'Bank Statement'],
}

# Create DataFrame
df = pd.DataFrame(sample_data)

# Save as Excel file
df.to_excel('/Users/rabab/the-genius-project/test_daily_report.xlsx', index=False)
print("Test Excel file created: test_daily_report.xlsx")

# Also create a JSON version for testing
json_data = df.to_dict('records')
with open('/Users/rabab/the-genius-project/test_daily_report.json', 'w') as f:
    json.dump(json_data, f, indent=2)
print("Test JSON file created: test_daily_report.json")

print("\nSample data structure:")
print(df.head())
