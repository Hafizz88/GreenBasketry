--function for updating adress
DECLARE
  v_thana_id INT;
  v_zone_id INT;
  v_existing_id INT;
BEGIN
  -- Get thana and corresponding zone
  SELECT id, zone_id INTO v_thana_id, v_zone_id
  FROM "Thanas"
  WHERE thana_name = p_thana_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid thana name %', p_thana_name;
  END IF;

  -- Check if address already exists
  SELECT a.address_id INTO v_existing_id
  FROM addresses a
  WHERE a.customer_id = p_customer_id;

  IF FOUND THEN
    UPDATE addresses
    SET address_line = p_address_line,
        thana_id = v_thana_id,
        zone_id = v_zone_id,
        postal_code = p_postal_code
    WHERE address_id = v_existing_id;

    RETURN QUERY SELECT v_existing_id, 'Address updated';
  ELSE
    INSERT INTO addresses (customer_id, address_line, thana_id, postal_code, zone_id)
    VALUES (p_customer_id, p_address_line, v_thana_id, p_postal_code, v_zone_id)
    RETURNING address_id INTO v_existing_id;

    RETURN QUERY SELECT v_existing_id, 'Address inserted';
  END IF;
END;


--function for getting cart summary with for vouchers
DECLARE
  v_cart_id INT;
  v_subtotal NUMERIC := 0;
  v_total_vat NUMERIC := 0;
  v_total_discount NUMERIC := 0;
  v_grand_total NUMERIC := 0;
  v_delivery_fee NUMERIC := 0;
  v_coupon_code TEXT;
  v_coupon_discount INT;
BEGIN
  -- 1. Get active cart ID
  SELECT c.cart_id INTO v_cart_id
  FROM carts c
  WHERE c.customer_id = p_customer_id AND c.is_active = true
  LIMIT 1;

  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'No active cart found for customer_id %', p_customer_id;
  END IF;

  -- 2. Compute subtotal, VAT, and discount
  SELECT
    COALESCE(SUM(p.price * ci.quantity), 0),
    COALESCE(SUM((p.vat_percentage / 100.0) * (p.price * ci.quantity)), 0),
    COALESCE(SUM((p.discount_percentage / 100.0) * (p.price * ci.quantity)), 0)
  INTO v_subtotal, v_total_vat, v_total_discount
  FROM cart_items ci
  JOIN products p ON p.product_id = ci.product_id
  WHERE ci.cart_id = v_cart_id;

  v_grand_total := v_subtotal + v_total_vat - v_total_discount;

  -- 3. Get delivery fee from customer's default address
  SELECT dz.default_delivery_fee INTO v_delivery_fee
  FROM addresses a
  JOIN "Thanas" t ON a.thana_id = t.id
  JOIN delivery_zones dz ON t.zone_id = dz.zone_id
  WHERE a.customer_id = p_customer_id AND a.is_default = true
  LIMIT 1;

  -- 4. Get active coupon info
  SELECT code, discount_percent
  INTO v_coupon_code, v_coupon_discount
  FROM coupons
  WHERE is_active = true AND CURRENT_DATE BETWEEN valid_from AND valid_to
  ORDER BY valid_from DESC
  LIMIT 1;

  -- 5. Return the results
  RETURN QUERY SELECT
    v_cart_id,
    v_subtotal,
    v_total_vat,
    v_total_discount,
    v_grand_total,
    v_delivery_fee,
    v_coupon_code,
    v_coupon_discount;
END;

-- function for deativating coupon
CREATE OR REPLACE FUNCTION deactivate_expired_coupons()
RETURNS VOID AS $$
BEGIN
  -- This function sets is_active to false for all coupons where the 'valid_to' date is
  -- earlier than the current date.
  UPDATE coupons
  SET is_active = FALSE
  WHERE valid_to < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
--function for resetting  discount
CREATE OR REPLACE FUNCTION reset_expired_product_discounts()
RETURNS void AS $$
BEGIN
  UPDATE products
  SET discount_percentage = 0
  WHERE discount_finished IS NOT NULL
    AND discount_finished < NOW()
    AND discount_percentage <> 0;
END;
$$ LANGUAGE plpgsql;
--trigger for logging crude operation by admin
-- Function for logging product inserts

CREATE OR REPLACE FUNCTION log_product_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO greenbasketary_admin_log (
    admin_user_id,
    timestamp,
    action_type,
    table_name,
    record_id,
    description
  ) VALUES (
    NEW.updated_by_admin_id::TEXT,
    now(),
    'CREATE',
    'products',
    NEW.product_id::TEXT,
    'New Product created: ' || NEW.name || ' (ID: ' || NEW.product_id || '). Price: ' || NEW.price || ', Stock: ' || NEW.stock || '.'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_after_insert ON public.products;
CREATE TRIGGER trg_products_after_insert
AFTER INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION log_product_insert();
CREATE OR REPLACE FUNCTION log_product_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO greenbasketary_admin_log (
    admin_user_id,
    timestamp,
    action_type,
    table_name,
    record_id,
    description
  ) VALUES (
    NEW.updated_by_admin_id::TEXT,
    now(),
    'UPDATE',
    'products',
    NEW.product_id::TEXT,
    'Product updated: ' || NEW.name || ' (ID: ' || NEW.product_id || ').'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_after_update ON public.products;
CREATE TRIGGER trg_products_after_update
AFTER UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION log_product_update();
CREATE OR REPLACE FUNCTION log_product_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO greenbasketary_admin_log (
    admin_user_id,
    timestamp,
    action_type,
    table_name,
    record_id,
    description
  ) VALUES (
    OLD.updated_by_admin_id::TEXT,
    now(),
    'DELETE',
    'products',
    OLD.product_id::TEXT,
    'Product deleted: ' || OLD.name || ' (ID: ' || OLD.product_id || ').'
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_after_delete ON public.products;
CREATE TRIGGER trg_products_after_delete
AFTER DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION log_product_delete();

CREATE OR REPLACE FUNCTION log_coupon_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO greenbasketary_admin_log (
    admin_user_id,
    timestamp,
    action_type,
    table_name,
    record_id,
    description
  ) VALUES (
    NEW.created_by_admin_id::TEXT,
    now(),
    'CREATE',
    'coupons',
    NEW.coupon_id::TEXT,
    'New Coupon created: ' || NEW.code || ' (ID: ' || NEW.coupon_id || '). Discount: ' || NEW.discount_percent || '%.'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_coupon_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO greenbasketary_admin_log (
    admin_user_id,
    timestamp,
    action_type,
    table_name,
    record_id,
    description
  ) VALUES (
    NEW.created_by_admin_id::TEXT,
    now(),
    'UPDATE',
    'coupons',
    NEW.coupon_id::TEXT,
    'Coupon updated: ' || NEW.code || ' (ID: ' || NEW.coupon_id || ').'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_coupon_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO greenbasketary_admin_log (
    admin_user_id,
    timestamp,
    action_type,
    table_name,
    record_id,
    description
  ) VALUES (
    OLD.created_by_admin_id::TEXT,
    now(),
    'DELETE',
    'coupons',
    OLD.coupon_id::TEXT,
    'Coupon deleted: ' || OLD.code || ' (ID: ' || OLD.coupon_id || ').'
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they already exist
DROP TRIGGER IF EXISTS trg_coupons_after_insert ON public.coupons;
DROP TRIGGER IF EXISTS trg_coupons_after_update ON public.coupons;
DROP TRIGGER IF EXISTS trg_coupons_after_delete ON public.coupons;

-- Create triggers
CREATE TRIGGER trg_coupons_after_insert
AFTER INSERT ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION log_coupon_insert();

CREATE TRIGGER trg_coupons_after_update
AFTER UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION log_coupon_update();

CREATE TRIGGER trg_coupons_after_delete
AFTER DELETE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION log_coupon_delete();