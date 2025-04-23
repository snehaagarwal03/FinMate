import os
import logging
from flask import Flask, render_template, redirect, url_for, request, jsonify

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "finmate-secret-key")

@app.route('/')
def index():
    return render_template(
        'index.html',
        firebase_api_key=os.environ.get("FIREBASE_API_KEY", ""),
        firebase_project_id=os.environ.get("FIREBASE_PROJECT_ID", ""),
        firebase_app_id=os.environ.get("FIREBASE_APP_ID", "")
    )

@app.route('/login')
def login():
    return render_template(
        'login.html',
        firebase_api_key=os.environ.get("FIREBASE_API_KEY", ""),
        firebase_project_id=os.environ.get("FIREBASE_PROJECT_ID", ""),
        firebase_app_id=os.environ.get("FIREBASE_APP_ID", "")
    )

@app.route('/signup')
def signup():
    return render_template(
        'signup.html',
        firebase_api_key=os.environ.get("FIREBASE_API_KEY", ""),
        firebase_project_id=os.environ.get("FIREBASE_PROJECT_ID", ""),
        firebase_app_id=os.environ.get("FIREBASE_APP_ID", "")
    )

@app.route('/dashboard')
def dashboard():
    return render_template(
        'dashboard.html',
        firebase_api_key=os.environ.get("FIREBASE_API_KEY", ""),
        firebase_project_id=os.environ.get("FIREBASE_PROJECT_ID", ""),
        firebase_app_id=os.environ.get("FIREBASE_APP_ID", "")
    )

@app.route('/transactions')
def transactions():
    return render_template(
        'transactions.html',
        firebase_api_key=os.environ.get("FIREBASE_API_KEY", ""),
        firebase_project_id=os.environ.get("FIREBASE_PROJECT_ID", ""),
        firebase_app_id=os.environ.get("FIREBASE_APP_ID", "")
    )

@app.route('/insights')
def insights():
    return render_template(
        'insights.html',
        firebase_api_key=os.environ.get("FIREBASE_API_KEY", ""),
        firebase_project_id=os.environ.get("FIREBASE_PROJECT_ID", ""),
        firebase_app_id=os.environ.get("FIREBASE_APP_ID", "")
    )

@app.route('/profile')
def profile():
    return render_template(
        'profile.html',
        firebase_api_key=os.environ.get("FIREBASE_API_KEY", ""),
        firebase_project_id=os.environ.get("FIREBASE_PROJECT_ID", ""),
        firebase_app_id=os.environ.get("FIREBASE_APP_ID", "")
    )

@app.route('/budgeting')
def budgeting():
    return render_template(
        'budgeting.html',
        firebase_api_key=os.environ.get("FIREBASE_API_KEY", ""),
        firebase_project_id=os.environ.get("FIREBASE_PROJECT_ID", ""),
        firebase_app_id=os.environ.get("FIREBASE_APP_ID", "")
    )
