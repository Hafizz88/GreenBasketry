-- Comprehensive Test Queries for RiderController.js
-- Testing all queries from the rider controller to identify issues

-- =====================================================
-- 1. RIDER LOGIN QUERIES
-- =====================================================

-- Test 1: Rider Login Query
-- This query should work fine
SELECT rider_id, name, email, phone, vehicle_info, available, password_hash 
FROM riders 
WHERE email = 'labib@gmail.com';

-- Test 2: Check if riders exist
SELECT COUNT(*) as total_riders FROM riders;

-- Test 3: Check available riders
SELECT COUNT(*) as available_riders FROM riders WHERE available = true;

-- =====================================================
-- 2. UPDATE RIDER LOCATION QUERIES
-- =====================================================

-- Test 4: Verify rider exists (used in updateRiderLocation)
SELECT rider_id FROM riders WHERE rider_id = 1;

-- =====================================================
-- 3. GET AVAILABLE ORDERS FOR RIDER QUERIES
-- =====================================================

-- Test 5: Main query for getAvailableOrdersForRider
-- This is the exact query from the controller
SELECT 
  o.order_id,
  o.order_date,
  o.order_status,
  o.total_amount,
  o.payment_status,
  d.delivery_id,
  d.delivery_status,
  c.name as customer_name,
  c.phone as customer_phone,
  addr.address_line,
  addr.postal_code,
  t.thana_name,
  dz.zone_name
FROM orders o
JOIN deliveries d ON o.order_id = d.order_id
JOIN carts cart ON o.cart_id = cart.cart_id
JOIN customers c ON cart.customer_id = c.customer_id
JOIN addresses addr ON o.address_id = addr.address_id
LEFT JOIN "Thanas" t ON addr.thana_id = t.id
JOIN delivery_zones dz ON addr.zone_id = dz.zone_id
WHERE dz.zone_name = 'North & Northeast Dhaka' 
  AND d.delivery_status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM delivery_assignments da 
    WHERE da.delivery_id = d.delivery_id
  )
ORDER BY o.order_date ASC;

-- Test 6: Check if delivery_zones table has data
SELECT zone_id, zone_name FROM delivery_zones ORDER BY zone_id;

-- Test 7: Check if addresses have proper zone_id
SELECT 
  addr.address_id,
  addr.address_line,
  dz.zone_name
FROM addresses addr
JOIN delivery_zones dz ON addr.zone_id = dz.zone_id
ORDER BY addr.address_id;

-- Test 8: Check if orders have proper address_id
SELECT 
  o.order_id,
  o.address_id,
  addr.address_line,
  dz.zone_name
FROM orders o
JOIN addresses addr ON o.address_id = addr.address_id
JOIN delivery_zones dz ON addr.zone_id = dz.zone_id
ORDER BY o.order_id;

-- Test 9: Check if deliveries exist for orders
SELECT 
  o.order_id,
  d.delivery_id,
  d.delivery_status
FROM orders o
LEFT JOIN deliveries d ON o.order_id = d.order_id
ORDER BY o.order_id;

-- =====================================================
-- 4. ACCEPT ORDER QUERIES
-- =====================================================

-- Test 10: Check if delivery is already assigned
SELECT * FROM delivery_assignments WHERE delivery_id = 1;

-- Test 11: Check if rider is available
SELECT available FROM riders WHERE rider_id = 1;

-- Test 12: Insert delivery assignment (simulate acceptOrder)
-- This would be the INSERT query from acceptOrder
-- INSERT INTO delivery_assignments (delivery_id, rider_id) VALUES (1, 1) RETURNING *;

-- Test 13: Update delivery status to assigned
-- UPDATE deliveries SET delivery_status = 'assigned' WHERE delivery_id = 1;

-- =====================================================
-- 5. SET DELIVERY TIME QUERIES
-- =====================================================

-- Test 14: Update delivery status and estimated time
-- This query should work fine
-- UPDATE deliveries SET delivery_status = 'in_progress', estimated_time = CURRENT_TIMESTAMP + INTERVAL '30 minutes' WHERE delivery_id = 1 RETURNING *;

-- =====================================================
-- 6. MARK ARRIVAL QUERIES
-- =====================================================

-- Test 15: Insert arrival notification
-- INSERT INTO arrival_notifications (delivery_id, rider_id, message) VALUES (1, 1, 'Rider has arrived at your location') RETURNING *;

-- Test 16: Update delivery status to arrived
-- UPDATE deliveries SET delivery_status = 'arrived' WHERE delivery_id = 1;

-- =====================================================
-- 7. CONFIRM PAYMENT RECEIVED QUERIES
-- =====================================================

-- Test 17: Update order payment status
-- UPDATE orders SET payment_status = true, payment_date = CURRENT_TIMESTAMP WHERE order_id = 1 RETURNING *;

-- Test 18: Update delivery status to completed
-- UPDATE deliveries SET delivery_status = 'completed' WHERE order_id = 1;

-- =====================================================
-- 8. GET RIDER CURRENT ASSIGNMENTS QUERIES
-- =====================================================

-- Test 19: Get rider's current assignments
SELECT 
  o.order_id,
  o.order_date,
  o.order_status,
  o.total_amount,
  o.payment_status,
  d.delivery_id,
  d.delivery_status,
  d.estimated_time,
  da.assigned_at,
  c.name as customer_name,
  c.phone as customer_phone,
  addr.address_line,
  addr.postal_code,
  t.thana_name,
  dz.zone_name
FROM orders o
JOIN deliveries d ON o.order_id = d.order_id
JOIN delivery_assignments da ON d.delivery_id = da.delivery_id
JOIN carts cart ON o.cart_id = cart.cart_id
JOIN customers c ON cart.customer_id = c.customer_id
JOIN addresses addr ON o.address_id = addr.address_id
LEFT JOIN "Thanas" t ON addr.thana_id = t.id
JOIN delivery_zones dz ON addr.zone_id = dz.zone_id
WHERE da.rider_id = 1 
  AND d.delivery_status IN ('assigned', 'pending', 'delivered','out_for_delivery','failed')
ORDER BY da.assigned_at DESC;

-- =====================================================
-- 9. GET RIDER ORDERS QUERIES
-- =====================================================

-- Test 20: Get all orders assigned to a specific rider
SELECT 
  o.order_id,
  o.order_date,
  o.order_status,
  o.total_amount,
  o.payment_status,
  d.delivery_id,
  d.delivery_status,
  d.estimated_time,
  da.assigned_at,
  c.name as customer_name,
  c.phone as customer_phone,
  addr.address_line,
  addr.postal_code,
  t.thana_name,
  dz.zone_name
FROM orders o
JOIN deliveries d ON o.order_id = d.order_id
JOIN delivery_assignments da ON d.delivery_id = da.delivery_id
JOIN carts cart ON o.cart_id = cart.cart_id
JOIN customers c ON cart.customer_id = c.customer_id
JOIN addresses addr ON o.address_id = addr.address_id
LEFT JOIN "Thanas" t ON addr.thana_id = t.id
JOIN delivery_zones dz ON addr.zone_id = dz.zone_id
WHERE da.rider_id = 1
ORDER BY da.assigned_at DESC;

-- =====================================================
-- 10. GET ORDERS BY ZONE QUERIES
-- =====================================================

-- Test 21: Get orders by zone (different from getAvailableOrdersForRider)
SELECT 
  o.order_id,
  o.order_date,
  o.order_status,
  o.total_amount,
  o.payment_status,
  d.delivery_id,
  d.delivery_status,
  d.estimated_time,
  c.name as customer_name,
  c.phone as customer_phone,
  addr.address_line,
  addr.postal_code,
  t.thana_name,
  dz.zone_name
FROM orders o
JOIN deliveries d ON o.order_id = d.order_id
JOIN carts cart ON o.cart_id = cart.cart_id
JOIN customers c ON cart.customer_id = c.customer_id
JOIN addresses addr ON o.address_id = addr.address_id
LEFT JOIN "Thanas" t ON addr.thana_id = t.id
JOIN delivery_zones dz ON addr.zone_id = dz.zone_id
WHERE dz.zone_name = 'North & Northeast Dhaka' 
  AND d.delivery_status = 'pending'
ORDER BY o.order_date ASC;

-- =====================================================
-- 11. ASSIGN DELIVERY TO RIDER QUERIES
-- =====================================================

-- Test 22: Check if delivery is already assigned
SELECT * FROM delivery_assignments WHERE delivery_id = 1;

-- Test 23: Check if rider is available
SELECT available FROM riders WHERE rider_id = 1;

-- Test 24: Insert delivery assignment
-- INSERT INTO delivery_assignments (delivery_id, rider_id) VALUES (1, 1) RETURNING *;

-- =====================================================
-- 12. UPDATE DELIVERY STATUS QUERIES
-- =====================================================

-- Test 25: Update delivery status
-- UPDATE deliveries SET delivery_status = 'in_progress', estimated_time = CURRENT_TIMESTAMP + INTERVAL '30 minutes' WHERE delivery_id = 1 RETURNING *;

-- =====================================================
-- 13. GET RIDER PROFILE QUERIES
-- =====================================================

-- Test 26: Get rider profile
SELECT 
  rider_id,
  name,
  phone,
  email,
  vehicle_info,
  available
FROM riders 
WHERE rider_id = 1;

-- =====================================================
-- 14. UPDATE RIDER AVAILABILITY QUERIES
-- =====================================================

-- Test 27: Update rider availability
-- UPDATE riders SET available = false WHERE rider_id = 1 RETURNING *;

-- =====================================================
-- 15. GET RIDER DELIVERY STATS QUERIES
-- =====================================================

-- Test 28: Get delivery statistics for rider
SELECT 
  COUNT(*) as total_deliveries,
  COUNT(CASE WHEN d.delivery_status = 'completed' THEN 1 END) as completed_deliveries,
  COUNT(CASE WHEN d.delivery_status = 'pending' THEN 1 END) as pending_deliveries,
  COUNT(CASE WHEN d.delivery_status = 'in_progress' THEN 1 END) as in_progress_deliveries
FROM delivery_assignments da
JOIN deliveries d ON da.delivery_id = d.delivery_id
WHERE da.rider_id = 1;

-- =====================================================
-- 16. CREATE ARRIVAL NOTIFICATION QUERIES
-- =====================================================

-- Test 29: Create arrival notification
-- INSERT INTO arrival_notifications (delivery_id, rider_id, message) VALUES (1, 1, 'Test notification') RETURNING *;

-- =====================================================
-- 17. GET RIDER NOTIFICATIONS QUERIES
-- =====================================================

-- Test 30: Get notifications for rider
SELECT 
  an.notification_id,
  an.message,
  an.is_read,
  an.created_at,
  d.delivery_id,
  o.order_id
FROM arrival_notifications an
JOIN deliveries d ON an.delivery_id = d.delivery_id
JOIN orders o ON d.order_id = o.order_id
WHERE an.rider_id = 1
ORDER BY an.created_at DESC;

-- =====================================================
-- 18. MARK NOTIFICATION AS READ QUERIES
-- =====================================================

-- Test 31: Mark notification as read
-- UPDATE arrival_notifications SET is_read = true WHERE notification_id = 1 RETURNING *;

-- =====================================================
-- 19. GET AVAILABLE RIDERS QUERIES
-- =====================================================

-- Test 32: Get available riders
SELECT 
  rider_id,
  name,
  phone,
  email,
  vehicle_info,
  available
FROM riders 
WHERE available = true
ORDER BY name;

-- =====================================================
-- 20. DATA INTEGRITY CHECKS
-- =====================================================

-- Test 33: Check if all orders have deliveries
SELECT 
  o.order_id,
  o.order_date,
  o.total_amount
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM deliveries d WHERE d.order_id = o.order_id
);

-- Test 34: Check if all deliveries have orders
SELECT 
  d.delivery_id,
  d.delivery_status
FROM deliveries d
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.order_id = d.order_id
);

-- Test 35: Check if all addresses have customers
SELECT 
  addr.address_id,
  addr.address_line
FROM addresses addr
WHERE NOT EXISTS (
  SELECT 1 FROM customers c WHERE c.customer_id = addr.customer_id
);

-- Test 36: Check if all orders have addresses
SELECT 
  o.order_id,
  o.order_date
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM addresses addr WHERE addr.address_id = o.address_id
);

-- Test 37: Check if all addresses have zones
SELECT 
  addr.address_id,
  addr.address_line
FROM addresses addr
WHERE NOT EXISTS (
  SELECT 1 FROM delivery_zones dz WHERE dz.zone_id = addr.zone_id
);

-- =====================================================
-- 21. SUMMARY STATISTICS
-- =====================================================

-- Test 38: Overall statistics
SELECT 
  'Total Orders' as metric, COUNT(*) as count FROM orders
UNION ALL
SELECT 'Total Deliveries', COUNT(*) FROM deliveries
UNION ALL
SELECT 'Pending Deliveries', COUNT(*) FROM deliveries WHERE delivery_status = 'pending'
UNION ALL
SELECT 'Assigned Deliveries', COUNT(*) FROM deliveries WHERE delivery_status = 'assigned'
UNION ALL
SELECT 'Completed Deliveries', COUNT(*) FROM deliveries WHERE delivery_status = 'completed'
UNION ALL
SELECT 'Available Riders', COUNT(*) FROM riders WHERE available = true
UNION ALL
SELECT 'Total Riders', COUNT(*) FROM riders
UNION ALL
SELECT 'Total Customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Total Addresses', COUNT(*) FROM addresses
UNION ALL
SELECT 'Total Zones', COUNT(*) FROM delivery_zones
UNION ALL
SELECT 'Total Delivery Assignments', COUNT(*) FROM delivery_assignments
UNION ALL
SELECT 'Total Notifications', COUNT(*) FROM arrival_notifications;

-- =====================================================
-- 22. POTENTIAL ISSUES IDENTIFIED
-- =====================================================

-- ISSUE 1: Check if delivery_status enum values are correct
-- The queries use 'pending', 'assigned', 'in_progress', 'arrived', 'completed'
-- Make sure these match your enum definition
SELECT unnest(enum_range(NULL::delivery_status_enum)) as valid_delivery_statuses;

-- ISSUE 2: Check if order_status enum values are correct
-- The queries use 'confirmed' and other statuses
-- Make sure these match your enum definition
SELECT unnest(enum_range(NULL::order_status_enum)) as valid_order_statuses;

-- ISSUE 3: Check if zone names in database match frontend expectations
-- The frontend sends: 'North & Northeast Dhaka', 'South Dhaka', 'Central Dhaka', 'Suburban Areas'
-- Make sure these exact names exist in your delivery_zones table
SELECT zone_name FROM delivery_zones ORDER BY zone_id;

-- ISSUE 4: Check if Thanas table has the correct structure
-- The queries use "Thanas" (quoted) and reference t.id and t.thana_name
-- Make sure the table structure matches
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Thanas' 
ORDER BY ordinal_position;
