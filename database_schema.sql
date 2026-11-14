/*******************************************************************************
 * AUTOLINE SYSTEMS: CONSOLIDATED MASTER DATABASE & OPERATIONS SCRIPT
 * Version: 2.0 (2026 Edition)
 * Includes: Schema, Seeds, CRUD, Analytics, and Auditing Logic
 *******************************************************************************/

-- ==========================================================
-- 1. SCHEMA CLEANUP (RESET)
-- ==========================================================
BEGIN
    FOR i IN (SELECT table_name FROM user_tables WHERE table_name IN (
        'AUDIT_LOG', 'DAILY_COST_SUMMARY', 'SYSTEM_ALERTS', 'SCHEDULED_REPORTS', 
        'SAVED_REPORTS', 'QUALITY_DEFECTS', 'QUALITY_TESTING', 'PARTS_USAGE', 
        'DAILY_PRODUCTION', 'BILL_OF_MATERIALS', 'PRODUCTION_TARGETS', 
        'EMPLOYEES', 'PARTS', 'DEFECT_CATEGORIES', 'PRODUCTION_LINES', 
        'CAR_MODELS', 'USERS'
    )) LOOP EXECUTE IMMEDIATE 'DROP TABLE ' || i.table_name || ' CASCADE CONSTRAINTS'; END LOOP;
END;
/

-- ==========================================================
-- 2. CORE SCHEMA DEFINITION
-- ==========================================================

-- Sequences
CREATE SEQUENCE seq_usage START WITH 1;
CREATE SEQUENCE seq_production START WITH 1;
CREATE SEQUENCE seq_audit START WITH 1;
CREATE SEQUENCE seq_report START WITH 1;
CREATE SEQUENCE quality_testing_seq START WITH 1;
CREATE SEQUENCE quality_defects_seq START WITH 1;
CREATE SEQUENCE system_alerts_seq START WITH 1;

-- Level 0: Master Tables
CREATE TABLE USERS (
    user_id NUMBER PRIMARY KEY, username VARCHAR2(50) UNIQUE, password_hash VARCHAR2(256),
    full_name VARCHAR2(100), email VARCHAR2(100) UNIQUE, user_role VARCHAR2(20),
    is_active VARCHAR2(1) DEFAULT 'Y', last_login TIMESTAMP
);

CREATE TABLE CAR_MODELS (
    model_id NUMBER PRIMARY KEY, model_name VARCHAR2(50) UNIQUE, model_type VARCHAR2(30),
    base_price NUMBER(10,2), model_code VARCHAR2(20) UNIQUE, is_active VARCHAR2(1) DEFAULT 'Y'
);

CREATE TABLE PRODUCTION_LINES (
    line_id NUMBER PRIMARY KEY, line_name VARCHAR2(50) UNIQUE, line_type VARCHAR2(30),
    status VARCHAR2(20) DEFAULT 'Active', daily_capacity NUMBER DEFAULT 200
);

CREATE TABLE PARTS (
    part_id NUMBER PRIMARY KEY, part_name VARCHAR2(50) UNIQUE, part_code VARCHAR2(20) UNIQUE,
    part_category VARCHAR2(30), unit_price NUMBER(10,2), stock_quantity NUMBER DEFAULT 0,
    min_stock_level NUMBER DEFAULT 100, last_updated DATE DEFAULT SYSDATE
);

CREATE TABLE DEFECT_CATEGORIES (
    defect_id NUMBER PRIMARY KEY, defect_name VARCHAR2(50) UNIQUE,
    defect_severity VARCHAR2(20) CHECK (defect_severity IN ('Minor', 'Major', 'Critical')),
    status VARCHAR2(1) DEFAULT 'Active'
);

-- Level 1: Dependency Tables
CREATE TABLE EMPLOYEES (
    employee_id NUMBER PRIMARY KEY, employee_name VARCHAR2(100), employee_code VARCHAR2(20) UNIQUE,
    designation VARCHAR2(50), line_id NUMBER REFERENCES PRODUCTION_LINES(line_id),
    is_active VARCHAR2(1) DEFAULT 'Y'
);

CREATE TABLE BILL_OF_MATERIALS (
    bom_id NUMBER PRIMARY KEY, model_id NUMBER REFERENCES CAR_MODELS(model_id),
    part_id NUMBER REFERENCES PARTS(part_id), quantity_per_car NUMBER NOT NULL
);

CREATE TABLE PRODUCTION_TARGETS (
    target_id NUMBER PRIMARY KEY, line_id NUMBER REFERENCES PRODUCTION_LINES(line_id),
    model_id NUMBER REFERENCES CAR_MODELS(model_id), target_month DATE,
    daily_target NUMBER, monthly_target NUMBER
);

-- Level 2: Transactional Tables
CREATE TABLE DAILY_PRODUCTION (
    production_id NUMBER PRIMARY KEY, production_date DATE,
    line_id NUMBER REFERENCES PRODUCTION_LINES(line_id),
    model_id NUMBER REFERENCES CAR_MODELS(model_id),
    quantity_produced NUMBER, shift VARCHAR2(20), 
    supervisor_id NUMBER REFERENCES EMPLOYEES(employee_id),
    notes VARCHAR2(500), created_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE TABLE PARTS_USAGE (
    usage_id NUMBER PRIMARY KEY, usage_date DATE, part_id NUMBER REFERENCES PARTS(part_id),
    quantity_used NUMBER, unit_price NUMBER(10,2), total_cost NUMBER(10,2),
    production_id NUMBER REFERENCES DAILY_PRODUCTION(production_id),
    line_id NUMBER REFERENCES PRODUCTION_LINES(line_id)
);

CREATE TABLE QUALITY_TESTING (
    test_id NUMBER PRIMARY KEY, test_date DATE, 
    line_id NUMBER REFERENCES PRODUCTION_LINES(line_id),
    model_id NUMBER REFERENCES CAR_MODELS(model_id),
    production_id NUMBER REFERENCES DAILY_PRODUCTION(production_id),
    cars_tested NUMBER, cars_passed NUMBER, cars_failed NUMBER,
    defect_percentage NUMBER(5,2), inspector_id NUMBER REFERENCES EMPLOYEES(employee_id),
    shift VARCHAR2(20), notes VARCHAR2(500)
);

CREATE TABLE QUALITY_DEFECTS (
    defect_record_id NUMBER PRIMARY KEY, test_id NUMBER REFERENCES QUALITY_TESTING(test_id),
    defect_id NUMBER REFERENCES DEFECT_CATEGORIES(defect_id), defect_count NUMBER
);

CREATE TABLE SYSTEM_ALERTS (
    alert_id NUMBER PRIMARY KEY, alert_date TIMESTAMP DEFAULT SYSTIMESTAMP,
    alert_type VARCHAR2(50), alert_severity VARCHAR2(20), alert_message VARCHAR2(500),
    is_read VARCHAR2(1) DEFAULT 'N', dismissed_at TIMESTAMP, related_id NUMBER
);

CREATE TABLE AUDIT_LOG (
    audit_id NUMBER PRIMARY KEY, table_name VARCHAR2(50), operation VARCHAR2(10),
    record_id NUMBER, old_value CLOB, new_value CLOB, changed_by VARCHAR2(50), 
    changed_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- ==========================================================


-- ==========================================================
-- 3. MASSIVE REAL-WORLD DATABASE SEEDS (25-50 PER TABLE)
-- ==========================================================

INSERT INTO USERS (user_id, username, password_hash, full_name, email, user_role) VALUES (1, 'admin', 'admin', 'System Admin', 'admin@autoline.systems', 'admin');
INSERT INTO USERS (user_id, username, password_hash, full_name, email, user_role) VALUES (2, 'manager', 'manager', 'Factory Manager', 'manager@autoline.systems', 'manager');
INSERT INTO USERS (user_id, username, password_hash, full_name, email, user_role) VALUES (3, 'user1', 'password', 'Operator One', 'user1@autoline.systems', 'operator');
INSERT INTO USERS (user_id, username, password_hash, full_name, email, user_role) VALUES (4, 'user2', 'password', 'Operator Two', 'user2@autoline.systems', 'operator');
INSERT INTO USERS (user_id, username, password_hash, full_name, email, user_role) VALUES (5, 'inspector1', 'inspect', 'Quality Inspector', 'qa@autoline.systems', 'inspector');
INSERT INTO USERS (user_id, username, password_hash, full_name, email, user_role) VALUES (6, 'supervisor1', 'super', 'Line Supervisor 1', 'super1@autoline.systems', 'supervisor');
INSERT INTO USERS (user_id, username, password_hash, full_name, email, user_role) VALUES (7, 'supervisor2', 'super', 'Line Supervisor 2', 'super2@autoline.systems', 'supervisor');
INSERT INTO USERS (user_id, username, password_hash, full_name, email, user_role) VALUES (8, 'user3', 'password123', 'Operator Three', 'user3@autoline.systems', 'operator');
INSERT INTO USERS (user_id, username, password_hash, full_name, email, user_role) VALUES (9, 'user4', 'password123', 'Operator Four', 'user4@autoline.systems', 'operator');
INSERT INTO USERS (user_id, username, password_hash, full_name, email, user_role) VALUES (10, 'admin2', 'admin2', 'Backup Admin', 'admin2@autoline.systems', 'admin');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (1, 'Mercedes-AMG GT', 'Sports', 115000, 'AMG-GT-01');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (2, 'Mercedes-Benz S-Class', 'Luxury Sedan', 110000, 'MB-S-24');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (3, 'Mercedes-Benz G-Wagon', 'Luxury SUV', 140000, 'MB-G-63');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (4, 'Mercedes-Benz C-Class', 'Sedan', 45000, 'MB-C-25');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (5, 'Ferrari F8 Tributo', 'Supercar', 280000, 'FER-F8-01');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (6, 'Ferrari SF90 Stradale', 'Supercar', 516000, 'FER-SF-90');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (7, 'Ferrari Roma', 'Grand Tourer', 225000, 'FER-RM-01');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (8, 'Ferrari Portofino M', 'Convertible', 230000, 'FER-PTF');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (9, 'Porsche 911 GT3 RS', 'Sports', 225000, 'POR-911-RS');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (10, 'Porsche Taycan Turbo S', 'Electric Sedan', 185000, 'POR-TY-TB');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (11, 'Porsche Panamera', 'Luxury Sedan', 90000, 'POR-PN-01');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (12, 'Porsche Macan GTS', 'Compact SUV', 80000, 'POR-MC-GTS');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (13, 'Audi RS e-tron GT', 'Electric Sports', 145000, 'AUD-RS-ET');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (14, 'Audi RS6 Avant', 'Wagon', 125000, 'AUD-RS6-A');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (15, 'Audi R8 V10 Performance', 'Supercar', 150000, 'AUD-R8-V10');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (16, 'Audi Q8 RS', 'Luxury SUV', 120000, 'AUD-Q8-RS');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (17, 'BMW M5 Competition', 'Sports Sedan', 130000, 'BMW-M5-C');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (18, 'BMW M4 CSL', 'Sports Coupe', 140000, 'BMW-M4-C');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (19, 'BMW X6 M', 'Performance SUV', 115000, 'BMW-X6-M');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (20, 'BMW i4 M50', 'Electric Sedan', 70000, 'BMW-I4-M');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (21, 'McLaren 720S', 'Supercar', 305000, 'MCL-720');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (22, 'McLaren Artura', 'Hybrid Supercar', 233000, 'MCL-ART');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (23, 'Aston Martin Vantage', 'Sports Coupe', 143000, 'AST-VAN');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (24, 'Aston Martin DBX707', 'Luxury SUV', 232000, 'AST-DBX');
INSERT INTO CAR_MODELS (model_id, model_name, model_type, base_price, model_code) VALUES (25, 'Lamborghini Huracan EVO', 'Supercar', 260000, 'LAM-HUR-E');
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (1, 'Alpha Assembly', 'General', 298);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (2, 'Beta Assembly', 'General', 115);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (3, 'Gamma Powertrain', 'General', 276);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (4, 'Delta Chassis', 'General', 160);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (5, 'Epsilon Paint', 'General', 178);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (6, 'Zeta Electronics', 'General', 317);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (7, 'Eta Interiors', 'General', 126);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (8, 'Theta Quality', 'General', 83);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (9, 'Iota Finishing', 'General', 120);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (10, 'Kappa Frame', 'General', 308);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (11, 'Lambda Wiring', 'General', 76);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (12, 'Mu Wheels', 'General', 77);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (13, 'Nu Seating', 'General', 197);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (14, 'Xi Engines', 'General', 327);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (15, 'Omicron Axles', 'General', 158);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (16, 'Pi Glass', 'General', 107);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (17, 'Rho Batteries', 'General', 334);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (18, 'Sigma HVAC', 'General', 81);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (19, 'Tau Suspension', 'General', 172);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (20, 'Upsilon Body', 'General', 350);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (21, 'Phi Alignment', 'General', 120);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (22, 'Chi Trims', 'General', 379);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (23, 'Psi Diagnostics', 'General', 239);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (24, 'Omega Test Track', 'General', 346);
INSERT INTO PRODUCTION_LINES (line_id, line_name, line_type, daily_capacity) VALUES (25, 'Stradale Handbuild', 'General', 250);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (1, 'V8 Twin-Turbo Block', 'PRT-9036', 'Exterior', 4240, 457, 139);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (2, 'V10 Engine Core', 'PRT-7760', 'Interior', 741, 350, 80);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (3, 'EV Battery Pack 93kWh', 'PRT-7712', 'Electronics', 1468, 673, 151);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (4, '7-Speed Dual Clutch Transmission', 'PRT-9753', 'Engine', 1401, 769, 106);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (5, 'Carbon Fiber Rear Wing', 'PRT-5813', 'Interior', 4629, 935, 197);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (6, 'LED Matrix Headlights', 'PRT-6025', 'Electronics', 3350, 720, 121);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (7, 'OLED Taillights', 'PRT-9013', 'Exterior', 3845, 973, 163);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (8, 'Ceramic Brake Calipers', 'PRT-8967', 'Engine', 4438, 470, 141);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (9, 'Sport Exhaust System', 'PRT-3680', 'Engine', 2716, 570, 122);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (10, 'Alcantara Steering Wheel', 'PRT-7206', 'Engine', 4880, 837, 101);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (11, 'Carbon Fiber Dashboard Trim', 'PRT-5770', 'Interior', 3639, 773, 142);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (12, '12in Digital Cluster', 'PRT-3658', 'Engine', 4163, 419, 165);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (13, 'Adaptive Air Suspension', 'PRT-3007', 'Exterior', 3648, 345, 159);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (14, 'Titanium Muffler', 'PRT-1785', 'Exterior', 4213, 711, 182);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (15, 'Leather Bucket Seats', 'PRT-5182', 'Exterior', 4075, 584, 134);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (16, '22in Forged Alloy Wheels', 'PRT-7147', 'Interior', 1546, 811, 178);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (17, 'Navigation Telematics CPU', 'PRT-2299', 'Engine', 3250, 267, 108);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (18, 'Radar Cruise Sensor', 'PRT-3275', 'Exterior', 619, 429, 188);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (19, 'Hybrid MGU-K Motor', 'PRT-8475', 'Electronics', 2325, 259, 168);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (20, 'Lithium-Ion Starter Battery', 'PRT-3577', 'Exterior', 725, 510, 177);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (21, 'Aero Diffuser Underbelly', 'PRT-4960', 'Exterior', 4861, 791, 141);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (22, 'Panoramic Glass Roof', 'PRT-2353', 'Electronics', 1165, 792, 98);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (23, 'Premium Burmester Speakers', 'PRT-9289', 'Electronics', 1889, 236, 59);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (24, 'Sport Chrono Clock', 'PRT-2221', 'Engine', 4869, 551, 71);
INSERT INTO PARTS (part_id, part_name, part_code, part_category, unit_price, stock_quantity, min_stock_level) VALUES (25, 'Coolant Radiator Assembly', 'PRT-8371', 'Electronics', 1715, 483, 78);
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (1, 'Paint Scratch', 'Minor');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (2, 'Uneven Panel Gap', 'Critical');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (3, 'Engine Misfire', 'Critical');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (4, 'Transmission Slip', 'Major');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (5, 'Faulty Wiring', 'Critical');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (6, 'Aero Component Misaligned', 'Major');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (7, 'Brake Squeak', 'Major');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (8, 'Suspension Rattle', 'Minor');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (9, 'Interior Trim Defect', 'Critical');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (10, 'Infotainment Crash', 'Critical');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (11, 'Headlight Condensation', 'Minor');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (12, 'Battery Fault', 'Major');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (13, 'Coolant Leak', 'Major');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (14, 'Oil Pressure Drop', 'Critical');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (15, 'Exhaust Vibration', 'Critical');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (16, 'Tire Pressure Sensor Failure', 'Major');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (17, 'Leather Stitching Flaw', 'Minor');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (18, 'Seat Motor Jam', 'Minor');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (19, 'AC Compressor Noise', 'Minor');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (20, 'Glass Tint Bubble', 'Critical');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (21, 'Steering Rack Play', 'Major');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (22, 'Carbon Fiber Weave Defect', 'Major');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (23, 'Wheel Balance Issue', 'Minor');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (24, 'Door Latch Stiff', 'Critical');
INSERT INTO DEFECT_CATEGORIES (defect_id, defect_name, defect_severity) VALUES (25, 'Wipers Streaking', 'Critical');
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (1, 'John Smith', 'EMP-X1', 'Technician', 15);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (2, 'Alice Johnson', 'EMP-X2', 'Technician', 11);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (3, 'Michael Williams', 'EMP-X3', 'Technician', 20);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (4, 'Maria Garcia', 'EMP-X4', 'Technician', 22);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (5, 'James Brown', 'EMP-X5', 'Technician', 5);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (6, 'Linda Davis', 'EMP-X6', 'Technician', 5);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (7, 'William Miller', 'EMP-X7', 'Technician', 22);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (8, 'Barbara Wilson', 'EMP-X8', 'Technician', 7);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (9, 'David Moore', 'EMP-X9', 'Technician', 3);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (10, 'Susan Taylor', 'EMP-X10', 'Technician', 6);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (11, 'Richard Anderson', 'EMP-X11', 'Technician', 19);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (12, 'Jessica Thomas', 'EMP-X12', 'Technician', 22);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (13, 'Joseph Jackson', 'EMP-X13', 'Technician', 17);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (14, 'Sarah White', 'EMP-X14', 'Technician', 9);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (15, 'Charles Harris', 'EMP-X15', 'Technician', 15);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (16, 'Karen Martin', 'EMP-X16', 'Technician', 19);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (17, 'Thomas Thompson', 'EMP-X17', 'Technician', 2);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (18, 'Nancy Garcia', 'EMP-X18', 'Technician', 3);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (19, 'Christopher Martinez', 'EMP-X19', 'Technician', 19);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (20, 'Lisa Robinson', 'EMP-X20', 'Technician', 25);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (21, 'Daniel Clark', 'EMP-X21', 'Technician', 17);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (22, 'Betty Rodriguez', 'EMP-X22', 'Technician', 12);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (23, 'Matthew Lewis', 'EMP-X23', 'Technician', 22);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (24, 'Margaret Lee', 'EMP-X24', 'Technician', 17);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (25, 'Anthony Walker', 'EMP-X25', 'Technician', 11);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (26, 'Sandra Hall', 'EMP-X26', 'Technician', 17);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (27, 'Mark Allen', 'EMP-X27', 'Technician', 8);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (28, 'Ashley Young', 'EMP-X28', 'Technician', 10);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (29, 'Donald Hernandez', 'EMP-X29', 'Technician', 9);
INSERT INTO EMPLOYEES (employee_id, employee_name, employee_code, designation, line_id) VALUES (30, 'Kimberly King', 'EMP-X30', 'Technician', 21);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (1, 13, 7, 1);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (2, 10, 17, 7);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (3, 15, 13, 3);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (4, 2, 21, 8);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (5, 19, 2, 1);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (6, 18, 9, 7);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (7, 25, 25, 1);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (8, 10, 3, 7);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (9, 11, 3, 5);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (10, 9, 5, 1);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (11, 14, 8, 5);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (12, 5, 22, 8);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (13, 14, 23, 3);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (14, 7, 3, 5);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (15, 19, 14, 6);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (16, 11, 10, 2);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (17, 6, 13, 2);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (18, 5, 11, 2);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (19, 12, 6, 8);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (20, 9, 18, 6);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (21, 12, 21, 8);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (22, 5, 7, 4);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (23, 2, 18, 2);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (24, 6, 14, 3);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (25, 10, 1, 2);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (26, 20, 19, 1);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (27, 11, 10, 1);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (28, 15, 2, 2);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (29, 12, 20, 1);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (30, 22, 25, 8);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (31, 7, 11, 5);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (32, 17, 19, 4);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (33, 23, 24, 2);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (34, 24, 25, 4);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (35, 10, 12, 3);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (36, 19, 15, 8);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (37, 17, 9, 6);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (38, 8, 16, 6);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (39, 5, 23, 2);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (40, 13, 11, 5);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (41, 16, 17, 8);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (42, 12, 3, 2);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (43, 2, 23, 5);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (44, 1, 24, 7);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (45, 15, 24, 1);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (46, 15, 22, 2);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (47, 15, 6, 4);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (48, 12, 4, 1);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (49, 3, 5, 1);
INSERT INTO BILL_OF_MATERIALS (bom_id, model_id, part_id, quantity_per_car) VALUES (50, 16, 3, 1);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (1, 7, 22, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 43, 1087);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (2, 22, 19, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 34, 1226);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (3, 14, 24, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 35, 1492);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (4, 7, 12, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 27, 1229);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (5, 5, 18, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 31, 1370);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (6, 24, 5, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 28, 687);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (7, 5, 18, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 35, 959);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (8, 8, 23, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 41, 570);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (9, 1, 18, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 16, 1263);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (10, 16, 4, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 26, 1100);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (11, 25, 3, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 46, 734);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (12, 12, 8, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 32, 562);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (13, 17, 2, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 39, 1418);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (14, 13, 6, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 29, 814);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (15, 10, 14, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 13, 689);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (16, 9, 12, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 38, 448);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (17, 20, 1, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 29, 703);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (18, 11, 14, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 40, 607);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (19, 6, 20, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 20, 326);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (20, 21, 7, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 40, 1016);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (21, 15, 9, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 28, 779);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (22, 6, 10, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 27, 899);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (23, 10, 5, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 30, 392);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (24, 25, 7, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 10, 676);
INSERT INTO PRODUCTION_TARGETS (target_id, line_id, model_id, target_month, daily_target, monthly_target) VALUES (25, 12, 15, TO_DATE('2026-04-01', 'YYYY-MM-DD'), 24, 1267);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (1, TRUNC(SYSDATE) - 0, 10, 6, 30, 'Morning', 8);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (2, TRUNC(SYSDATE) - 0, 18, 16, 21, 'Morning', 4);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (3, TRUNC(SYSDATE) - 0, 23, 7, 27, 'Morning', 14);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (4, TRUNC(SYSDATE) - 2, 13, 3, 17, 'Morning', 14);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (5, TRUNC(SYSDATE) - 5, 17, 2, 42, 'Morning', 11);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (6, TRUNC(SYSDATE) - 5, 5, 1, 32, 'Morning', 10);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (7, TRUNC(SYSDATE) - 5, 16, 11, 11, 'Morning', 3);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (8, TRUNC(SYSDATE) - 0, 25, 19, 6, 'Morning', 18);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (9, TRUNC(SYSDATE) - 0, 18, 14, 22, 'Morning', 29);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (10, TRUNC(SYSDATE) - 3, 8, 21, 28, 'Morning', 25);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (11, TRUNC(SYSDATE) - 2, 2, 25, 36, 'Morning', 2);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (12, TRUNC(SYSDATE) - 5, 22, 23, 14, 'Morning', 13);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (13, TRUNC(SYSDATE) - 1, 9, 18, 17, 'Morning', 27);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (14, TRUNC(SYSDATE) - 5, 16, 13, 5, 'Morning', 19);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (15, TRUNC(SYSDATE) - 3, 19, 15, 39, 'Morning', 6);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (16, TRUNC(SYSDATE) - 4, 12, 10, 30, 'Morning', 11);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (17, TRUNC(SYSDATE) - 0, 1, 7, 5, 'Morning', 11);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (18, TRUNC(SYSDATE) - 0, 21, 1, 35, 'Morning', 13);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (19, TRUNC(SYSDATE) - 3, 7, 12, 23, 'Morning', 16);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (20, TRUNC(SYSDATE) - 2, 13, 5, 7, 'Morning', 3);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (21, TRUNC(SYSDATE) - 0, 1, 5, 8, 'Morning', 7);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (22, TRUNC(SYSDATE) - 3, 3, 22, 34, 'Morning', 25);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (23, TRUNC(SYSDATE) - 3, 15, 12, 42, 'Morning', 30);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (24, TRUNC(SYSDATE) - 1, 21, 16, 31, 'Morning', 11);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (25, TRUNC(SYSDATE) - 2, 9, 1, 18, 'Morning', 14);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (26, TRUNC(SYSDATE) - 4, 16, 7, 21, 'Morning', 24);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (27, TRUNC(SYSDATE) - 1, 21, 7, 18, 'Morning', 14);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (28, TRUNC(SYSDATE) - 5, 8, 9, 38, 'Morning', 7);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (29, TRUNC(SYSDATE) - 0, 19, 3, 34, 'Morning', 19);
INSERT INTO DAILY_PRODUCTION (production_id, production_date, line_id, model_id, quantity_produced, shift, supervisor_id) VALUES (30, TRUNC(SYSDATE) - 5, 23, 18, 37, 'Morning', 3);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (1, TRUNC(SYSDATE) - 2, 19, 76, 50.00, 5000.00, 13, 5);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (2, TRUNC(SYSDATE) - 1, 19, 48, 50.00, 5000.00, 1, 18);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (3, TRUNC(SYSDATE) - 2, 10, 76, 50.00, 5000.00, 21, 9);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (4, TRUNC(SYSDATE) - 5, 7, 25, 50.00, 5000.00, 10, 6);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (5, TRUNC(SYSDATE) - 2, 10, 59, 50.00, 5000.00, 10, 8);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (6, TRUNC(SYSDATE) - 5, 5, 51, 50.00, 5000.00, 25, 20);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (7, TRUNC(SYSDATE) - 2, 22, 70, 50.00, 5000.00, 18, 17);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (8, TRUNC(SYSDATE) - 3, 11, 96, 50.00, 5000.00, 11, 10);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (9, TRUNC(SYSDATE) - 4, 8, 74, 50.00, 5000.00, 4, 3);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (10, TRUNC(SYSDATE) - 4, 7, 12, 50.00, 5000.00, 25, 21);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (11, TRUNC(SYSDATE) - 5, 15, 12, 50.00, 5000.00, 11, 15);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (12, TRUNC(SYSDATE) - 1, 11, 37, 50.00, 5000.00, 4, 3);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (13, TRUNC(SYSDATE) - 3, 5, 96, 50.00, 5000.00, 13, 22);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (14, TRUNC(SYSDATE) - 3, 5, 50, 50.00, 5000.00, 3, 1);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (15, TRUNC(SYSDATE) - 4, 6, 30, 50.00, 5000.00, 21, 17);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (16, TRUNC(SYSDATE) - 3, 8, 69, 50.00, 5000.00, 3, 15);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (17, TRUNC(SYSDATE) - 0, 2, 95, 50.00, 5000.00, 5, 3);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (18, TRUNC(SYSDATE) - 0, 18, 43, 50.00, 5000.00, 12, 23);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (19, TRUNC(SYSDATE) - 1, 8, 54, 50.00, 5000.00, 16, 22);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (20, TRUNC(SYSDATE) - 2, 25, 80, 50.00, 5000.00, 26, 12);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (21, TRUNC(SYSDATE) - 0, 19, 85, 50.00, 5000.00, 28, 20);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (22, TRUNC(SYSDATE) - 5, 9, 14, 50.00, 5000.00, 4, 1);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (23, TRUNC(SYSDATE) - 3, 17, 76, 50.00, 5000.00, 28, 5);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (24, TRUNC(SYSDATE) - 2, 25, 50, 50.00, 5000.00, 19, 13);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (25, TRUNC(SYSDATE) - 1, 13, 39, 50.00, 5000.00, 12, 12);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (26, TRUNC(SYSDATE) - 4, 23, 36, 50.00, 5000.00, 30, 11);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (27, TRUNC(SYSDATE) - 4, 21, 35, 50.00, 5000.00, 4, 23);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (28, TRUNC(SYSDATE) - 0, 13, 16, 50.00, 5000.00, 28, 13);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (29, TRUNC(SYSDATE) - 4, 5, 37, 50.00, 5000.00, 16, 21);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (30, TRUNC(SYSDATE) - 4, 2, 88, 50.00, 5000.00, 7, 13);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (31, TRUNC(SYSDATE) - 4, 12, 100, 50.00, 5000.00, 9, 22);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (32, TRUNC(SYSDATE) - 1, 16, 41, 50.00, 5000.00, 5, 6);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (33, TRUNC(SYSDATE) - 4, 3, 34, 50.00, 5000.00, 22, 21);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (34, TRUNC(SYSDATE) - 2, 9, 59, 50.00, 5000.00, 28, 22);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (35, TRUNC(SYSDATE) - 4, 5, 80, 50.00, 5000.00, 10, 8);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (36, TRUNC(SYSDATE) - 4, 1, 26, 50.00, 5000.00, 28, 25);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (37, TRUNC(SYSDATE) - 1, 14, 80, 50.00, 5000.00, 7, 22);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (38, TRUNC(SYSDATE) - 3, 25, 44, 50.00, 5000.00, 12, 12);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (39, TRUNC(SYSDATE) - 5, 8, 83, 50.00, 5000.00, 25, 11);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (40, TRUNC(SYSDATE) - 4, 3, 21, 50.00, 5000.00, 22, 25);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (41, TRUNC(SYSDATE) - 2, 8, 66, 50.00, 5000.00, 14, 23);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (42, TRUNC(SYSDATE) - 0, 18, 54, 50.00, 5000.00, 6, 3);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (43, TRUNC(SYSDATE) - 1, 4, 86, 50.00, 5000.00, 29, 1);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (44, TRUNC(SYSDATE) - 0, 10, 30, 50.00, 5000.00, 13, 19);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (45, TRUNC(SYSDATE) - 3, 9, 71, 50.00, 5000.00, 4, 11);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (46, TRUNC(SYSDATE) - 5, 24, 62, 50.00, 5000.00, 24, 4);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (47, TRUNC(SYSDATE) - 2, 9, 14, 50.00, 5000.00, 15, 6);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (48, TRUNC(SYSDATE) - 1, 1, 85, 50.00, 5000.00, 27, 17);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (49, TRUNC(SYSDATE) - 4, 5, 30, 50.00, 5000.00, 18, 6);
INSERT INTO PARTS_USAGE (usage_id, usage_date, part_id, quantity_used, unit_price, total_cost, production_id, line_id) VALUES (50, TRUNC(SYSDATE) - 0, 24, 69, 50.00, 5000.00, 30, 10);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (1, TRUNC(SYSDATE) - 5, 2, 25, 12, 14, 9, 5, 35.71, 12);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (2, TRUNC(SYSDATE) - 1, 8, 9, 26, 20, 15, 5, 25.00, 9);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (3, TRUNC(SYSDATE) - 0, 18, 24, 15, 21, 19, 2, 9.52, 14);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (4, TRUNC(SYSDATE) - 0, 24, 20, 12, 17, 16, 1, 5.88, 3);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (5, TRUNC(SYSDATE) - 2, 22, 14, 8, 17, 16, 1, 5.88, 5);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (6, TRUNC(SYSDATE) - 5, 22, 9, 14, 29, 29, 0, 0.00, 16);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (7, TRUNC(SYSDATE) - 5, 9, 11, 20, 11, 7, 4, 36.36, 22);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (8, TRUNC(SYSDATE) - 1, 23, 7, 10, 20, 17, 3, 15.00, 25);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (9, TRUNC(SYSDATE) - 4, 13, 16, 5, 17, 15, 2, 11.76, 18);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (10, TRUNC(SYSDATE) - 4, 2, 24, 25, 16, 15, 1, 6.25, 16);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (11, TRUNC(SYSDATE) - 0, 6, 7, 4, 47, 44, 3, 6.38, 27);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (12, TRUNC(SYSDATE) - 0, 23, 4, 5, 45, 43, 2, 4.44, 11);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (13, TRUNC(SYSDATE) - 3, 22, 14, 9, 14, 12, 2, 14.29, 23);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (14, TRUNC(SYSDATE) - 0, 9, 22, 2, 24, 20, 4, 16.67, 22);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (15, TRUNC(SYSDATE) - 2, 11, 14, 29, 38, 33, 5, 13.16, 12);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (16, TRUNC(SYSDATE) - 4, 14, 16, 23, 16, 15, 1, 6.25, 30);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (17, TRUNC(SYSDATE) - 0, 24, 22, 17, 18, 15, 3, 16.67, 2);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (18, TRUNC(SYSDATE) - 5, 10, 23, 8, 28, 25, 3, 10.71, 14);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (19, TRUNC(SYSDATE) - 3, 21, 19, 12, 35, 35, 0, 0.00, 5);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (20, TRUNC(SYSDATE) - 3, 9, 20, 4, 40, 40, 0, 0.00, 21);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (21, TRUNC(SYSDATE) - 0, 7, 21, 5, 24, 23, 1, 4.17, 1);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (22, TRUNC(SYSDATE) - 2, 22, 20, 27, 11, 7, 4, 36.36, 14);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (23, TRUNC(SYSDATE) - 2, 16, 9, 2, 26, 25, 1, 3.85, 18);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (24, TRUNC(SYSDATE) - 1, 9, 19, 17, 24, 24, 0, 0.00, 22);
INSERT INTO QUALITY_TESTING (test_id, test_date, line_id, model_id, production_id, cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id) VALUES (25, TRUNC(SYSDATE) - 0, 10, 8, 3, 29, 25, 4, 13.79, 18);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (1, 16, 3, 2);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (2, 19, 24, 2);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (3, 10, 21, 2);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (4, 3, 23, 1);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (5, 12, 9, 2);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (6, 10, 11, 2);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (7, 23, 4, 2);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (8, 17, 17, 1);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (9, 7, 11, 3);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (10, 9, 18, 3);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (11, 14, 11, 1);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (12, 8, 12, 1);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (13, 5, 24, 1);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (14, 22, 9, 2);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (15, 5, 12, 1);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (16, 18, 7, 1);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (17, 17, 9, 1);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (18, 16, 24, 1);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (19, 18, 22, 1);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (20, 13, 10, 2);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (21, 23, 25, 2);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (22, 11, 16, 3);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (23, 14, 7, 2);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (24, 19, 7, 2);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (25, 4, 19, 2);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (26, 18, 19, 1);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (27, 3, 16, 2);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (28, 23, 3, 1);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (29, 12, 23, 1);
INSERT INTO QUALITY_DEFECTS (defect_record_id, test_id, defect_id, defect_count) VALUES (30, 7, 21, 3);
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (1, 'Inventory Alert', 'Major', 'Low stock for part 13');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (2, 'Inventory Alert', 'Minor', 'Low stock for part 10');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (3, 'Inventory Alert', 'Major', 'Low stock for part 10');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (4, 'Inventory Alert', 'Minor', 'Low stock for part 24');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (5, 'Inventory Alert', 'Minor', 'Low stock for part 5');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (6, 'Inventory Alert', 'Major', 'Low stock for part 10');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (7, 'Inventory Alert', 'Minor', 'Low stock for part 9');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (8, 'Inventory Alert', 'Major', 'Low stock for part 22');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (9, 'Inventory Alert', 'Major', 'Low stock for part 3');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (10, 'Inventory Alert', 'Minor', 'Low stock for part 11');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (11, 'Inventory Alert', 'Minor', 'Low stock for part 15');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (12, 'Inventory Alert', 'Major', 'Low stock for part 13');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (13, 'Inventory Alert', 'Minor', 'Low stock for part 23');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (14, 'Inventory Alert', 'Minor', 'Low stock for part 2');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (15, 'Inventory Alert', 'Minor', 'Low stock for part 13');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (16, 'Inventory Alert', 'Minor', 'Low stock for part 22');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (17, 'Inventory Alert', 'Major', 'Low stock for part 17');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (18, 'Inventory Alert', 'Major', 'Low stock for part 11');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (19, 'Inventory Alert', 'Minor', 'Low stock for part 1');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (20, 'Inventory Alert', 'Minor', 'Low stock for part 1');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (21, 'Inventory Alert', 'Major', 'Low stock for part 16');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (22, 'Inventory Alert', 'Major', 'Low stock for part 19');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (23, 'Inventory Alert', 'Major', 'Low stock for part 13');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (24, 'Inventory Alert', 'Major', 'Low stock for part 7');
INSERT INTO SYSTEM_ALERTS (alert_id, alert_type, alert_severity, alert_message) VALUES (25, 'Inventory Alert', 'Minor', 'Low stock for part 17');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (1, 'CAR_MODELS', 'UPDATE', 23, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (2, 'CAR_MODELS', 'UPDATE', 21, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (3, 'CAR_MODELS', 'UPDATE', 23, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (4, 'CAR_MODELS', 'UPDATE', 3, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (5, 'CAR_MODELS', 'UPDATE', 12, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (6, 'CAR_MODELS', 'UPDATE', 23, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (7, 'CAR_MODELS', 'UPDATE', 2, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (8, 'CAR_MODELS', 'UPDATE', 16, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (9, 'CAR_MODELS', 'UPDATE', 17, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (10, 'CAR_MODELS', 'UPDATE', 10, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (11, 'CAR_MODELS', 'UPDATE', 10, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (12, 'CAR_MODELS', 'UPDATE', 5, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (13, 'CAR_MODELS', 'UPDATE', 9, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (14, 'CAR_MODELS', 'UPDATE', 20, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (15, 'CAR_MODELS', 'UPDATE', 14, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (16, 'CAR_MODELS', 'UPDATE', 25, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (17, 'CAR_MODELS', 'UPDATE', 17, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (18, 'CAR_MODELS', 'UPDATE', 15, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (19, 'CAR_MODELS', 'UPDATE', 23, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (20, 'CAR_MODELS', 'UPDATE', 23, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (21, 'CAR_MODELS', 'UPDATE', 19, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (22, 'CAR_MODELS', 'UPDATE', 12, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (23, 'CAR_MODELS', 'UPDATE', 8, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (24, 'CAR_MODELS', 'UPDATE', 16, 'admin');
INSERT INTO AUDIT_LOG (audit_id, table_name, operation, record_id, changed_by) VALUES (25, 'CAR_MODELS', 'UPDATE', 13, 'admin');

COMMIT;


-- Update sequences to avoid collision
DECLARE
  max_val NUMBER;
BEGIN
  SELECT MAX(usage_id) INTO max_val FROM PARTS_USAGE;
  IF max_val IS NOT NULL THEN
    EXECUTE IMMEDIATE 'ALTER SEQUENCE seq_usage RESTART START WITH ' || (max_val + 1);
  END IF;
  
  SELECT MAX(production_id) INTO max_val FROM DAILY_PRODUCTION;
  IF max_val IS NOT NULL THEN
    EXECUTE IMMEDIATE 'ALTER SEQUENCE seq_production RESTART START WITH ' || (max_val + 1);
  END IF;
END;
/
