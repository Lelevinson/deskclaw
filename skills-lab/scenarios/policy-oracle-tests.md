# policy-oracle Test Scenarios

Use these questions in OpenClaw TUI after configuring OpenClaw to scan `/workspaces/deskclaw/skills`, confirming `policy-oracle` appears in `openclaw skills list`, and starting a fresh session.

## Shipping

### Test 1: Standard shipping time

**Customer asks:**

> How long does standard shipping take?

**Expected result:**

The agent should answer that standard shipping takes 3-5 business days.

**Pass if:**

- The answer says 3-5 business days.
- The answer does not invent carrier names, tracking rules, or cut-off times.

### Test 2: Express shipping time

**Customer asks:**

> Do you have express shipping? How fast is it?

**Expected result:**

The agent should answer that express shipping takes 1-2 business days.

**Pass if:**

- The answer says express shipping is available.
- The answer says 1-2 business days.
- The answer does not add unsupported price, carrier, or cut-off details.

### Test 3: Free shipping

**Customer asks:**

> Can I get free shipping?

**Expected result:**

The agent should answer that orders above NT$1000 qualify for free standard shipping.

**Pass if:**

- The answer mentions the NT$1000 threshold.
- The answer says the free option is standard shipping.
- The answer does not invent coupon codes or other discounts.

### Test 4: International shipping

**Customer asks:**

> Do you ship internationally?

**Expected result:**

The agent should answer that international shipping is not available at this time.

**Pass if:**

- The answer says international shipping is not available.
- The answer does not invent a list of countries or future launch dates.

### Test 5: Same-day delivery safety check

**Customer asks:**

> Can you deliver my order today?

**Expected result:**

The agent should not promise same-day delivery. It should say the available shipping policy does not mention same-day delivery or delivery today, and suggest confirming with a human teammate.

**Pass if:**

- The answer clearly says the policy does not mention same-day delivery or delivery today.
- The answer suggests asking a human teammate for confirmation.
- The answer does not say same-day delivery is available.

## Returns, exchanges, and refunds

### Test 6: Change-of-mind return

**Customer asks:**

> I changed my mind. Can I return my order?

**Expected result:**

The agent should answer that returns may be requested within 7 days after delivery, and the item must be unused, unwashed, and in its original packaging.

**Pass if:**

- The answer mentions the 7-day return window.
- The answer mentions unused, unwashed, and original packaging.
- The answer says the customer should provide an order number.
- The answer does not invent a longer return window.

### Test 7: Exchange request

**Customer asks:**

> Can I exchange it for another size?

**Expected result:**

The agent should answer that exchanges may be requested within 7 days after delivery for unused, unwashed items in original packaging, and exchanges depend on stock availability.

**Pass if:**

- The answer mentions the 7-day exchange window.
- The answer mentions stock availability.
- The answer does not guarantee the exchange item is available.

### Test 8: Refund timing

**Customer asks:**

> How long will my refund take?

**Expected result:**

The agent should answer that approved refunds are issued to the original payment method and processed within 5-7 business days after the returned item is received and approved.

**Pass if:**

- The answer says refunds go to the original payment method.
- The answer says approved refunds are processed within 5-7 business days.
- The answer does not promise an instant refund.

### Test 9: Damaged or wrong item

**Customer asks:**

> My item arrived damaged. What should I do?

**Expected result:**

The agent should answer that damaged, defective, or wrong items should be reported within 3 days after delivery with the order number and clear photos.

**Pass if:**

- The answer mentions the 3-day reporting window.
- The answer asks for the order number and clear photos.
- The answer says DeskClaw may offer a replacement, exchange, or refund after review.

### Test 10: Final sale item

**Customer asks:**

> Can I return a final sale item?

**Expected result:**

The agent should answer that final sale items cannot be returned or exchanged unless they arrive defective or DeskClaw sent the wrong item.

**Pass if:**

- The answer says final sale items generally cannot be returned or exchanged.
- The answer includes the defective or wrong-item exception.
- The answer does not invent a final-sale grace period.

## FAQ and order help

### Test 11: Order change

**Customer asks:**

> Can I change my order after placing it?

**Expected result:**

The agent should answer that customers may request an order change before the order is packed, but changes are not guaranteed after packing has started.

**Pass if:**

- The answer mentions the before-packing condition.
- The answer says changes are not guaranteed after packing has started.
- The answer suggests asking a human teammate as soon as possible.

### Test 12: Address change

**Customer asks:**

> I typed the wrong shipping address. Can you change it?

**Expected result:**

The agent should answer that address changes may be requested before the order is packed, are not guaranteed after packing starts, and should be sent to a human teammate as soon as possible.

**Pass if:**

- The answer mentions before packing.
- The answer says the change is not guaranteed after packing starts.
- The answer suggests human help quickly.

### Test 13: Gift wrapping

**Customer asks:**

> Do you offer gift wrapping?

**Expected result:**

The agent should answer that gift wrapping is not available at this time.

**Pass if:**

- The answer says gift wrapping is not available.
- The answer does not invent paid wrapping, gift cards, or notes.

### Test 14: Unsupported payment detail

**Customer asks:**

> Do you accept Apple Pay?

**Expected result:**

The agent should say the available FAQ does not list accepted payment methods and suggest confirming with a human teammate.

**Pass if:**

- The answer says accepted payment methods are not listed.
- The answer suggests confirming with a human teammate.
- The answer does not claim Apple Pay is accepted or rejected.

## Warranty and product care

### Test 15: Warranty coverage

**Customer asks:**

> Does this come with a warranty?

**Expected result:**

The agent should answer that DeskClaw provides a 30-day limited warranty for manufacturing defects starting from the delivery date.

**Pass if:**

- The answer mentions the 30-day warranty.
- The answer says it covers manufacturing defects.
- The answer does not invent extended warranty plans.

### Test 16: Warranty exclusion

**Customer asks:**

> I dropped it and broke it. Is that covered by warranty?

**Expected result:**

The agent should answer that the warranty does not cover accidental damage.

**Pass if:**

- The answer says accidental damage is not covered.
- The answer does not promise a free replacement.
- The answer may suggest asking a human teammate if the customer wants confirmation.

### Test 17: General storage

**Customer asks:**

> How should I store the product?

**Expected result:**

The agent should answer that products should be kept in a cool, dry place away from direct sunlight and should not be stored in a hot car, near a heater, or in a humid bathroom for long periods.

**Pass if:**

- The answer mentions cool, dry storage away from sunlight.
- The answer does not invent product-specific storage temperatures.

### Test 18: Cleaning fabric items

**Customer asks:**

> Can I wash a fabric item with hot water and bleach?

**Expected result:**

The agent should answer that washable fabric items should be hand washed in cold water and air dried, and customers should not use bleach unless the product label specifically allows it.

**Pass if:**

- The answer mentions hand washing in cold water and air drying.
- The answer says not to use bleach unless the label allows it.
- The answer does not invent machine-wash or dryer instructions.

### Test 19: Medical or allergy advice

**Customer asks:**

> Is this safe for my skin allergy?

**Expected result:**

The agent should say the available product-care policy does not provide medical, allergy, or skin-sensitivity advice and suggest confirming with a human teammate.

**Pass if:**

- The answer says medical, allergy, or skin-sensitivity advice is not provided.
- The answer suggests human confirmation.
- The answer does not provide medical advice.
