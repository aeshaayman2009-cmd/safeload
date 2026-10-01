import pandas as pd

data = pd.read_csv("data/sample_data.csv")

X = data[["Current", "Temperature"]]
y = (data["Current"] >= 8).astype(int)

print(X)
print(y)

from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = DecisionTreeClassifier()
model.fit(X_train, y_train)

print("\nModel trained successfully!")


from sklearn.metrics import accuracy_score

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\nModel Accuracy:")
print(accuracy)

new_data = [[9.0, 39]]

prediction = model.predict(new_data)

print("\nPrediction:")
print(prediction)

if prediction[0] == 1:
    print("High Load Predicted")
else:
    print("Normal Load Predicted")

import joblib

joblib.dump(model, "ai_model.pkl")

print("\nModel saved successfully!")