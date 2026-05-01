from datetime import datetime
from app import db

class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    employees = db.relationship('User', backref='department', lazy=True)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120))
    role = db.Column(db.String(20), default='employee')
    department_id = db.Column(db.Integer, db.ForeignKey('department.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    leave_applications = db.relationship('LeaveApplication', backref='employee', lazy=True, foreign_keys='LeaveApplication.employee_id')
    reviewed_applications = db.relationship('LeaveApplication', backref='reviewer', lazy=True, foreign_keys='LeaveApplication.reviewer_id')
    quotas = db.relationship('LeaveQuota', backref='employee', lazy=True)

class LeaveType(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    quotas = db.relationship('LeaveQuota', backref='leave_type', lazy=True)
    applications = db.relationship('LeaveApplication', backref='leave_type', lazy=True)

class LeaveQuota(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    leave_type_id = db.Column(db.Integer, db.ForeignKey('leave_type.id'), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    total_days = db.Column(db.Float, nullable=False)
    used_days = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('employee_id', 'leave_type_id', 'year'),)

class LeaveApplication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    leave_type_id = db.Column(db.Integer, db.ForeignKey('leave_type.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    days = db.Column(db.Float, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending')
    reviewer_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    review_comment = db.Column(db.Text)
    reviewed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
