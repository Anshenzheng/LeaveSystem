from datetime import datetime, date, timedelta
from functools import wraps
from flask import request, jsonify, session, make_response
from werkzeug.security import generate_password_hash, check_password_hash
from openpyxl import Workbook
from io import BytesIO

from app import app, db
from models import User, Department, LeaveType, LeaveQuota, LeaveApplication

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': '未登录'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': '未登录'}), 401
        user = User.query.get(session['user_id'])
        if user.role not in ['admin', 'manager']:
            return jsonify({'error': '无权限'}), 403
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': '用户名已存在'}), 400
    
    user = User(
        username=data['username'],
        password=generate_password_hash(data['password']),
        name=data['name'],
        email=data.get('email'),
        role=data.get('role', 'employee'),
        department_id=data.get('department_id')
    )
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': '注册成功', 'user': {
        'id': user.id, 'username': user.username, 'name': user.name, 'role': user.role
    }}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'error': '用户名或密码错误'}), 401
    
    session['user_id'] = user.id
    department = Department.query.get(user.department_id) if user.department_id else None
    
    return jsonify({
        'message': '登录成功',
        'user': {
            'id': user.id,
            'username': user.username,
            'name': user.name,
            'role': user.role,
            'email': user.email,
            'department_id': user.department_id,
            'department_name': department.name if department else None
        }
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': '已登出'})

@app.route('/api/auth/me', methods=['GET'])
@login_required
def get_current_user():
    user = User.query.get(session['user_id'])
    department = Department.query.get(user.department_id) if user.department_id else None
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'name': user.name,
        'role': user.role,
        'email': user.email,
        'department_id': user.department_id,
        'department_name': department.name if department else None
    })

@app.route('/api/departments', methods=['GET'])
@login_required
def get_departments():
    departments = Department.query.all()
    return jsonify([{
        'id': d.id,
        'name': d.name,
        'created_at': d.created_at.isoformat()
    } for d in departments])

@app.route('/api/departments', methods=['POST'])
@admin_required
def create_department():
    data = request.json
    if Department.query.filter_by(name=data['name']).first():
        return jsonify({'error': '部门已存在'}), 400
    
    department = Department(name=data['name'])
    db.session.add(department)
    db.session.commit()
    
    return jsonify({'id': department.id, 'name': department.name}), 201

@app.route('/api/departments/<int:dept_id>', methods=['PUT'])
@admin_required
def update_department(dept_id):
    department = Department.query.get_or_404(dept_id)
    data = request.json
    
    if 'name' in data:
        existing = Department.query.filter_by(name=data['name']).first()
        if existing and existing.id != dept_id:
            return jsonify({'error': '部门名称已存在'}), 400
        department.name = data['name']
    
    db.session.commit()
    return jsonify({'id': department.id, 'name': department.name})

@app.route('/api/departments/<int:dept_id>', methods=['DELETE'])
@admin_required
def delete_department(dept_id):
    department = Department.query.get_or_404(dept_id)
    
    if department.employees:
        return jsonify({'error': '该部门下还有员工，无法删除'}), 400
    
    db.session.delete(department)
    db.session.commit()
    return jsonify({'message': '删除成功'})

@app.route('/api/users', methods=['GET'])
@admin_required
def get_users():
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'name': u.name,
        'email': u.email,
        'role': u.role,
        'department_id': u.department_id,
        'department_name': u.department.name if u.department else None,
        'created_at': u.created_at.isoformat()
    } for u in users])

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    
    if 'name' in data:
        user.name = data['name']
    if 'email' in data:
        user.email = data['email']
    if 'role' in data:
        user.role = data['role']
    if 'department_id' in data:
        user.department_id = data['department_id']
    if 'password' in data and data['password']:
        user.password = generate_password_hash(data['password'])
    
    db.session.commit()
    return jsonify({'message': '更新成功'})

@app.route('/api/leave-types', methods=['GET'])
@login_required
def get_leave_types():
    leave_types = LeaveType.query.filter_by(is_active=True).all()
    return jsonify([{
        'id': lt.id,
        'name': lt.name,
        'code': lt.code,
        'description': lt.description
    } for lt in leave_types])

@app.route('/api/leave-types', methods=['POST'])
@admin_required
def create_leave_type():
    data = request.json
    
    if LeaveType.query.filter_by(code=data['code']).first():
        return jsonify({'error': '假期类型代码已存在'}), 400
    
    leave_type = LeaveType(
        name=data['name'],
        code=data['code'],
        description=data.get('description')
    )
    db.session.add(leave_type)
    db.session.commit()
    
    return jsonify({
        'id': leave_type.id,
        'name': leave_type.name,
        'code': leave_type.code
    }), 201

@app.route('/api/leave-types/<int:lt_id>', methods=['PUT'])
@admin_required
def update_leave_type(lt_id):
    leave_type = LeaveType.query.get_or_404(lt_id)
    data = request.json
    
    if 'name' in data:
        leave_type.name = data['name']
    if 'description' in data:
        leave_type.description = data['description']
    if 'is_active' in data:
        leave_type.is_active = data['is_active']
    
    db.session.commit()
    return jsonify({'message': '更新成功'})

@app.route('/api/quotas', methods=['GET'])
@admin_required
def get_all_quotas():
    year = request.args.get('year', date.today().year, type=int)
    department_id = request.args.get('department_id', type=int)
    employee_id = request.args.get('employee_id', type=int)
    
    query = LeaveQuota.query.filter_by(year=year)
    
    if employee_id:
        query = query.filter_by(employee_id=employee_id)
    elif department_id:
        query = query.join(User).filter(User.department_id == department_id)
    
    quotas = query.all()
    
    result = []
    for q in quotas:
        user = User.query.get(q.employee_id)
        leave_type = LeaveType.query.get(q.leave_type_id)
        result.append({
            'id': q.id,
            'employee_id': q.employee_id,
            'employee_name': user.name if user else None,
            'leave_type_id': q.leave_type_id,
            'leave_type_name': leave_type.name if leave_type else None,
            'year': q.year,
            'total_days': q.total_days,
            'used_days': q.used_days,
            'remaining_days': q.total_days - q.used_days,
            'updated_at': q.updated_at.isoformat()
        })
    
    return jsonify(result)

@app.route('/api/quotas/my', methods=['GET'])
@login_required
def get_my_quotas():
    user_id = session['user_id']
    year = request.args.get('year', date.today().year, type=int)
    
    quotas = LeaveQuota.query.filter_by(employee_id=user_id, year=year).all()
    
    result = []
    for q in quotas:
        leave_type = LeaveType.query.get(q.leave_type_id)
        result.append({
            'id': q.id,
            'leave_type_id': q.leave_type_id,
            'leave_type_name': leave_type.name if leave_type else None,
            'leave_type_code': leave_type.code if leave_type else None,
            'year': q.year,
            'total_days': q.total_days,
            'used_days': q.used_days,
            'remaining_days': q.total_days - q.used_days
        })
    
    return jsonify(result)

@app.route('/api/quotas', methods=['POST'])
@admin_required
def create_quota():
    data = request.json
    
    existing = LeaveQuota.query.filter_by(
        employee_id=data['employee_id'],
        leave_type_id=data['leave_type_id'],
        year=data['year']
    ).first()
    
    if existing:
        return jsonify({'error': '该员工该年度的假期额度已存在'}), 400
    
    quota = LeaveQuota(
        employee_id=data['employee_id'],
        leave_type_id=data['leave_type_id'],
        year=data['year'],
        total_days=data['total_days'],
        used_days=data.get('used_days', 0)
    )
    db.session.add(quota)
    db.session.commit()
    
    return jsonify({'message': '创建成功', 'id': quota.id}), 201

@app.route('/api/quotas/batch', methods=['POST'])
@admin_required
def create_quotas_batch():
    data = request.json
    employee_ids = data.get('employee_ids', [])
    leave_type_id = data['leave_type_id']
    year = data['year']
    total_days = data['total_days']
    
    created_count = 0
    for emp_id in employee_ids:
        existing = LeaveQuota.query.filter_by(
            employee_id=emp_id,
            leave_type_id=leave_type_id,
            year=year
        ).first()
        
        if not existing:
            quota = LeaveQuota(
                employee_id=emp_id,
                leave_type_id=leave_type_id,
                year=year,
                total_days=total_days
            )
            db.session.add(quota)
            created_count += 1
    
    db.session.commit()
    return jsonify({'message': f'成功创建 {created_count} 条额度记录'})

@app.route('/api/quotas/<int:quota_id>', methods=['PUT'])
@admin_required
def update_quota(quota_id):
    quota = LeaveQuota.query.get_or_404(quota_id)
    data = request.json
    
    if 'total_days' in data:
        if data['total_days'] < quota.used_days:
            return jsonify({'error': '总天数不能小于已使用天数'}), 400
        quota.total_days = data['total_days']
    
    db.session.commit()
    return jsonify({'message': '更新成功'})

@app.route('/api/applications', methods=['GET'])
@login_required
def get_applications():
    user = User.query.get(session['user_id'])
    status = request.args.get('status')
    department_id = request.args.get('department_id', type=int)
    employee_id = request.args.get('employee_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = LeaveApplication.query
    
    if user.role == 'employee':
        query = query.filter_by(employee_id=user.id)
    else:
        if department_id:
            query = query.join(User).filter(User.department_id == department_id)
        if employee_id:
            query = query.filter_by(employee_id=employee_id)
    
    if status:
        query = query.filter_by(status=status)
    
    if start_date:
        query = query.filter(LeaveApplication.start_date >= date.fromisoformat(start_date))
    if end_date:
        query = query.filter(LeaveApplication.end_date <= date.fromisoformat(end_date))
    
    applications = query.order_by(LeaveApplication.created_at.desc()).all()
    
    result = []
    for app in applications:
        employee = User.query.get(app.employee_id)
        reviewer = User.query.get(app.reviewer_id) if app.reviewer_id else None
        leave_type = LeaveType.query.get(app.leave_type_id)
        
        result.append({
            'id': app.id,
            'employee_id': app.employee_id,
            'employee_name': employee.name if employee else None,
            'department_id': employee.department_id if employee else None,
            'department_name': employee.department.name if employee and employee.department else None,
            'leave_type_id': app.leave_type_id,
            'leave_type_name': leave_type.name if leave_type else None,
            'start_date': app.start_date.isoformat(),
            'end_date': app.end_date.isoformat(),
            'days': app.days,
            'reason': app.reason,
            'status': app.status,
            'reviewer_id': app.reviewer_id,
            'reviewer_name': reviewer.name if reviewer else None,
            'review_comment': app.review_comment,
            'reviewed_at': app.reviewed_at.isoformat() if app.reviewed_at else None,
            'created_at': app.created_at.isoformat()
        })
    
    return jsonify(result)

@app.route('/api/applications/<int:app_id>', methods=['GET'])
@login_required
def get_application(app_id):
    app = LeaveApplication.query.get_or_404(app_id)
    user = User.query.get(session['user_id'])
    
    if user.role == 'employee' and app.employee_id != user.id:
        return jsonify({'error': '无权限查看此申请'}), 403
    
    employee = User.query.get(app.employee_id)
    reviewer = User.query.get(app.reviewer_id) if app.reviewer_id else None
    leave_type = LeaveType.query.get(app.leave_type_id)
    
    return jsonify({
        'id': app.id,
        'employee_id': app.employee_id,
        'employee_name': employee.name if employee else None,
        'department_id': employee.department_id if employee else None,
        'department_name': employee.department.name if employee and employee.department else None,
        'leave_type_id': app.leave_type_id,
        'leave_type_name': leave_type.name if leave_type else None,
        'start_date': app.start_date.isoformat(),
        'end_date': app.end_date.isoformat(),
        'days': app.days,
        'reason': app.reason,
        'status': app.status,
        'reviewer_id': app.reviewer_id,
        'reviewer_name': reviewer.name if reviewer else None,
        'review_comment': app.review_comment,
        'reviewed_at': app.reviewed_at.isoformat() if app.reviewed_at else None,
        'created_at': app.created_at.isoformat()
    })

@app.route('/api/applications', methods=['POST'])
@login_required
def create_application():
    user = User.query.get(session['user_id'])
    data = request.json
    
    start_date = date.fromisoformat(data['start_date'])
    end_date = date.fromisoformat(data['end_date'])
    
    if start_date > end_date:
        return jsonify({'error': '开始日期不能晚于结束日期'}), 400
    
    days = (end_date - start_date).days + 1
    
    if start_date < date.today():
        return jsonify({'error': '不能申请过去的日期'}), 400
    
    year = start_date.year
    quota = LeaveQuota.query.filter_by(
        employee_id=user.id,
        leave_type_id=data['leave_type_id'],
        year=year
    ).first()
    
    if not quota:
        return jsonify({'error': '没有找到对应年度的假期额度'}), 400
    
    remaining = quota.total_days - quota.used_days
    if days > remaining:
        return jsonify({
            'error': f'假期额度不足，剩余 {remaining} 天，申请 {days} 天'
        }), 400
    
    overlapping = LeaveApplication.query.filter(
        LeaveApplication.employee_id == user.id,
        LeaveApplication.status != 'rejected',
        LeaveApplication.start_date <= end_date,
        LeaveApplication.end_date >= start_date
    ).first()
    
    if overlapping:
        return jsonify({'error': '与已有的假期申请时间重叠'}), 400
    
    application = LeaveApplication(
        employee_id=user.id,
        leave_type_id=data['leave_type_id'],
        start_date=start_date,
        end_date=end_date,
        days=days,
        reason=data['reason'],
        status='pending'
    )
    db.session.add(application)
    db.session.commit()
    
    return jsonify({
        'message': '申请提交成功',
        'id': application.id,
        'days': days
    }), 201

@app.route('/api/applications/<int:app_id>/review', methods=['POST'])
@admin_required
def review_application(app_id):
    application = LeaveApplication.query.get_or_404(app_id)
    user = User.query.get(session['user_id'])
    data = request.json
    
    if application.status != 'pending':
        return jsonify({'error': '只能审核待处理的申请'}), 400
    
    status = data['status']
    review_comment = data.get('review_comment')
    
    if status == 'approved':
        year = application.start_date.year
        quota = LeaveQuota.query.filter_by(
            employee_id=application.employee_id,
            leave_type_id=application.leave_type_id,
            year=year
        ).first()
        
        if not quota:
            return jsonify({'error': '找不到对应额度记录'}), 400
        
        remaining = quota.total_days - quota.used_days
        if application.days > remaining:
            return jsonify({
                'error': f'额度不足，剩余 {remaining} 天，申请 {application.days} 天'
            }), 400
        
        quota.used_days += application.days
    
    application.status = status
    application.reviewer_id = user.id
    application.review_comment = review_comment
    application.reviewed_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'message': '审核完成'})

@app.route('/api/applications/<int:app_id>', methods=['DELETE'])
@login_required
def cancel_application(app_id):
    application = LeaveApplication.query.get_or_404(app_id)
    user = User.query.get(session['user_id'])
    
    if user.role == 'employee' and application.employee_id != user.id:
        return jsonify({'error': '无权限取消此申请'}), 403
    
    if application.status != 'pending':
        return jsonify({'error': '只能取消待处理的申请'}), 400
    
    db.session.delete(application)
    db.session.commit()
    
    return jsonify({'message': '申请已取消'})

@app.route('/api/calendar', methods=['GET'])
@admin_required
def get_calendar_data():
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    department_id = request.args.get('department_id', type=int)
    
    if not start_date_str or not end_date_str:
        today = date.today()
        start_date = today.replace(day=1)
        if today.month == 12:
            end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
    else:
        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)
    
    query = LeaveApplication.query.filter(
        LeaveApplication.status == 'approved',
        LeaveApplication.start_date <= end_date,
        LeaveApplication.end_date >= start_date
    )
    
    if department_id:
        query = query.join(User).filter(User.department_id == department_id)
    
    applications = query.all()
    
    result = []
    for app in applications:
        employee = User.query.get(app.employee_id)
        leave_type = LeaveType.query.get(app.leave_type_id)
        
        result.append({
            'id': app.id,
            'employee_id': app.employee_id,
            'employee_name': employee.name if employee else None,
            'department_name': employee.department.name if employee and employee.department else None,
            'leave_type_name': leave_type.name if leave_type else None,
            'start_date': app.start_date.isoformat(),
            'end_date': app.end_date.isoformat(),
            'days': app.days,
            'status': app.status
        })
    
    return jsonify(result)

@app.route('/api/export/applications', methods=['GET'])
@admin_required
def export_applications():
    department_id = request.args.get('department_id', type=int)
    employee_id = request.args.get('employee_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    status = request.args.get('status')
    
    query = LeaveApplication.query
    
    if department_id:
        query = query.join(User).filter(User.department_id == department_id)
    if employee_id:
        query = query.filter_by(employee_id=employee_id)
    if start_date:
        query = query.filter(LeaveApplication.start_date >= date.fromisoformat(start_date))
    if end_date:
        query = query.filter(LeaveApplication.end_date <= date.fromisoformat(end_date))
    if status:
        query = query.filter_by(status=status)
    
    applications = query.order_by(LeaveApplication.created_at.desc()).all()
    
    wb = Workbook()
    ws = wb.active
    ws.title = '请假记录'
    
    headers = [
        '员工姓名', '部门', '假期类型', '开始日期', '结束日期',
        '天数', '请假原因', '状态', '审核人', '审核意见', '申请时间'
    ]
    ws.append(headers)
    
    for app in applications:
        employee = User.query.get(app.employee_id)
        reviewer = User.query.get(app.reviewer_id) if app.reviewer_id else None
        leave_type = LeaveType.query.get(app.leave_type_id)
        dept = employee.department if employee else None
        
        status_text = {'pending': '待审核', 'approved': '已通过', 'rejected': '已拒绝'}.get(app.status, app.status)
        
        ws.append([
            employee.name if employee else '',
            dept.name if dept else '',
            leave_type.name if leave_type else '',
            app.start_date.strftime('%Y-%m-%d'),
            app.end_date.strftime('%Y-%m-%d'),
            app.days,
            app.reason,
            status_text,
            reviewer.name if reviewer else '',
            app.review_comment or '',
            app.created_at.strftime('%Y-%m-%d %H:%M:%S')
        ])
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    response.headers['Content-Disposition'] = f'attachment; filename=leave_records_{date.today().isoformat()}.xlsx'
    
    return response

@app.route('/api/init', methods=['POST'])
def init_system():
    if Department.query.count() > 0:
        return jsonify({'error': '系统已初始化'}), 400
    
    dept1 = Department(name='技术部')
    dept2 = Department(name='人事部')
    db.session.add_all([dept1, dept2])
    db.session.flush()
    
    admin = User(
        username='admin',
        password=generate_password_hash('admin123'),
        name='管理员',
        email='admin@company.com',
        role='admin',
        department_id=dept2.id
    )
    
    manager1 = User(
        username='manager1',
        password=generate_password_hash('manager123'),
        name='张经理',
        email='zhang@company.com',
        role='manager',
        department_id=dept1.id
    )
    
    employee1 = User(
        username='emp1',
        password=generate_password_hash('emp123'),
        name='李员工',
        email='li@company.com',
        role='employee',
        department_id=dept1.id
    )
    
    employee2 = User(
        username='emp2',
        password=generate_password_hash('emp123'),
        name='王员工',
        email='wang@company.com',
        role='employee',
        department_id=dept1.id
    )
    
    db.session.add_all([admin, manager1, employee1, employee2])
    db.session.flush()
    
    lt1 = LeaveType(name='年假', code='annual', description='带薪年假')
    lt2 = LeaveType(name='病假', code='sick', description='病假')
    lt3 = LeaveType(name='事假', code='personal', description='事假')
    lt4 = LeaveType(name='婚假', code='marriage', description='婚假')
    lt5 = LeaveType(name='产假', code='maternity', description='产假')
    
    db.session.add_all([lt1, lt2, lt3, lt4, lt5])
    db.session.flush()
    
    current_year = date.today().year
    
    for emp in [employee1, employee2, manager1]:
        q1 = LeaveQuota(employee_id=emp.id, leave_type_id=lt1.id, year=current_year, total_days=10)
        q2 = LeaveQuota(employee_id=emp.id, leave_type_id=lt2.id, year=current_year, total_days=5)
        q3 = LeaveQuota(employee_id=emp.id, leave_type_id=lt3.id, year=current_year, total_days=5)
        db.session.add_all([q1, q2, q3])
    
    db.session.commit()
    
    return jsonify({
        'message': '系统初始化完成',
        'users': [
            {'username': 'admin', 'password': 'admin123', 'role': '管理员'},
            {'username': 'manager1', 'password': 'manager123', 'role': '部门经理'},
            {'username': 'emp1', 'password': 'emp123', 'role': '员工'},
            {'username': 'emp2', 'password': 'emp123', 'role': '员工'}
        ]
    })
