import sqlite3
import pandas as pd

data = pd.read_csv("data/sample_data.csv")

connection = sqlite3.connect("database/safeload.db")

data.to_sql("readings", connection, if_exists="replace", index=False)

connection.close()

print("Data transferred to SQLite successfully!")