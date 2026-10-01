import pandas as pd

data = pd.read_csv("data/sample_data.csv")

print(data)

print("\nAverage Current:")
print(data["Current"].mean())

print("\nMaximum Current:")
print(data["Current"].max())

print("\nStatus Counts:")
print(data["Status"].value_counts())

print("\nAverage Temperature:")
print(data["Temperature"].mean())

print("\nMaximum Temperature:")
print(data["Temperature"].max())
print("\nLoad Percentage:")
data["Load_Percentage"] = (data["Current"] / data["Maximum_Limit"]) * 100
print(data[["Current", "Maximum_Limit", "Load_Percentage"]])

print("\nCritical Readings:")
print(data[data["Status"] == "Critical"])
print("\nHighest Warning Current:")
print(data[data["Status"] == "Warning"]["Current"].max())

print("\nWarning Count:")
print((data["Status"] == "Warning").sum())

print("\nCritical Count:")
print((data["Status"] == "Critical").sum())

print("\nTop 5 Highest Current Readings:")
print(data.nlargest(5, "Current")[["Time", "Current", "Temperature", "Status"]])








data["High_Load"] = (data["Current"] >= 8).astype(int)

print("\nAI Data:")
print(data[["Current", "Temperature", "High_Load"]])