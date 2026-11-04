import os
import openpyxl

PROJECT_ROOT = r"C:\Users\bsowm\OneDrive\Documents\PDD\project-11"
FILE_PATH = os.path.join(PROJECT_ROOT, "reports", "BIOPATCH_AI_COMPLETE_QA_RESULTS_1000.xlsx")

print("=" * 60)
print("VALIDATING MASTER QA EXCEL WORKBOOK")
print("File:", FILE_PATH)

if not os.path.exists(FILE_PATH):
    raise FileNotFoundError(f"Workbook not found at {FILE_PATH}")

size_kb = os.path.getsize(FILE_PATH) / 1024
print(f"File Size: {size_kb:.2f} KB")

wb = openpyxl.load_workbook(FILE_PATH, data_only=False)

expected_sheets = [
    "Executive Dashboard",
    "All 1000 Test Results",
    "Selenium Results",
    "Appium Results",
    "Load Testing Results",
    "Stress Testing Results",
    "Spike Testing Results",
    "Performance Analysis",
    "Defects and Failures",
    "Test Environment"
]

print(f"Total Sheets in Workbook: {len(wb.sheetnames)}")
assert wb.sheetnames == expected_sheets, f"Sheet mismatch: {wb.sheetnames} vs {expected_sheets}"
print("Sheet names verified successfully: 10/10 present.")

# Check All 1000 Test Results
ws_all = wb["All 1000 Test Results"]
assert ws_all.max_row == 1001, f"Expected 1001 rows (1 header + 1000 data), got {ws_all.max_row}"
assert ws_all.max_column == 23, f"Expected 23 columns, got {ws_all.max_column}"

# Check uniqueness of Test IDs
test_ids = set()
for r in range(2, 1002):
    t_id = ws_all.cell(row=r, column=2).value
    assert t_id not in test_ids, f"Duplicate Test ID: {t_id} at row {r}"
    test_ids.add(t_id)

assert len(test_ids) == 1000, f"Expected 1000 unique Test IDs, found {len(test_ids)}"
print("All 1000 Test Results verified: 1000 unique test IDs across 23 columns.")

# Check individual category sheets
category_sheets = [
    ("Selenium Results", 201),
    ("Appium Results", 201),
    ("Load Testing Results", 201),
    ("Stress Testing Results", 201),
    ("Spike Testing Results", 201)
]

for s_name, exp_rows in category_sheets:
    ws = wb[s_name]
    assert ws.max_row == exp_rows, f"Sheet {s_name}: expected {exp_rows} rows, got {ws.max_row}"
    assert ws.max_column == 23, f"Sheet {s_name}: expected 23 columns, got {ws.max_column}"
    print(f"Sheet '{s_name}' verified: {ws.max_row - 1} data rows, {ws.max_column} columns.")

# Check Dashboard formulas
ws_dash = wb["Executive Dashboard"]
print("Dashboard Formulas:")
print("  Total KPI formula:", ws_dash["B7"].value)
print("  Executed KPI formula:", ws_dash["D7"].value)
print("  Row 11 Total Cases formula:", ws_dash["D11"].value)
print("  Row 11 Passed formula:", ws_dash["F11"].value)
print("  Row 16 Total Passed formula:", ws_dash["F16"].value)
print("  Dashboard charts count:", len(ws_dash._charts))
assert len(ws_dash._charts) >= 2, f"Expected at least 2 charts on Dashboard, got {len(ws_dash._charts)}"

# Check Performance Analysis sheet
ws_perf = wb["Performance Analysis"]
assert ws_perf.max_row >= 20, f"Expected >= 20 rows in Performance Analysis, got {ws_perf.max_row}"
print(f"Performance Analysis sheet verified: {ws_perf.max_row} rows.")

# Check Defects and Failures sheet
ws_def = wb["Defects and Failures"]
assert ws_def.max_row >= 10, f"Expected >= 10 rows in Defects, got {ws_def.max_row}"
print(f"Defects sheet verified: {ws_def.max_row} rows.")

# Check Test Environment sheet
ws_env = wb["Test Environment"]
assert ws_env.max_row >= 20, f"Expected >= 20 rows in Test Environment, got {ws_env.max_row}"
print(f"Test Environment sheet verified: {ws_env.max_row} rows.")

print("=" * 60)
print("ALL MASTER WORKBOOK VALIDATIONS PASSED PERFECTLY!")
print("=" * 60)
