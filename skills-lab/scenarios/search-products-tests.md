# search-products Test Scenarios

Use these questions in OpenClaw TUI after configuring OpenClaw to scan `/workspaces/deskclaw/skills`, confirming `search-products` appears in `openclaw skills list`, and starting a fresh session.

## Test 1: Oily skin recommendation

**Customer asks:**

> Use the search-products skill. I have oily skin and want a lightweight moisturizer. What should I buy?

**Expected result:**

The agent should recommend Clear Day Gel Moisturizer.

**Pass if:**

- The answer mentions Clear Day Gel Moisturizer.
- The answer mentions NT$560.
- The reason connects to oily skin, combination skin, or lightweight daytime moisture.
- The answer does not invent ingredients or medical claims.

## Test 2: Dry or sensitive skin

**Customer asks:**

> Use the search-products skill. My skin is dry and sensitive. Which moisturizer fits?

**Expected result:**

The agent should recommend Calm Barrier Cream and may mention Cloud Cleanser as a gentle companion if giving more than one option.

**Pass if:**

- The answer mentions Calm Barrier Cream.
- The answer mentions NT$680.
- The answer connects the recommendation to dry or sensitive skin.
- The answer does not promise allergy-safe or medical results.

## Test 3: Beginner routine under NT$1000

**Customer asks:**

> Use the search-products skill. I am new to skincare and want a simple starter routine under NT$1000.

**Expected result:**

The agent should recommend Glow Starter Kit.

**Pass if:**

- The answer mentions Glow Starter Kit.
- The answer mentions NT$980.
- The answer says it fits a beginner or simple starter routine.
- The answer does not invent products inside the kit beyond the catalog description.

## Test 4: Gift under NT$800

**Customer asks:**

> Use the search-products skill. I need a small gift under NT$800.

**Expected result:**

The agent should recommend Travel Mini Trio and may mention Cotton Carry Pouch as a cheaper add-on or alternative.

**Pass if:**

- The answer mentions Travel Mini Trio at NT$720.
- The answer may mention Cotton Carry Pouch at NT$350.
- The answer mentions low stock if it recommends Travel Mini Trio.
- The answer does not invent gift wrapping or gift cards.

## Test 5: Daily sunscreen

**Customer asks:**

> Use the search-products skill. Do you have sunscreen for a morning routine?

**Expected result:**

The agent should recommend Sunny Shield SPF50.

**Pass if:**

- The answer mentions Sunny Shield SPF50.
- The answer mentions NT$520.
- The answer connects it to daily sun protection or a morning routine.
- The answer does not claim it is waterproof.

## Test 6: Exfoliating toner with caution

**Customer asks:**

> Use the search-products skill. My skin looks dull and textured. Is there an exfoliating product?

**Expected result:**

The agent should recommend Soft Reset Exfoliating Toner and include a caution that it is for customers already comfortable with active or exfoliating products.

**Pass if:**

- The answer mentions Soft Reset Exfoliating Toner.
- The answer mentions NT$620.
- The answer includes the beginner or irritation caution if relevant.
- The answer does not promise to cure a skin condition.

## Test 7: No exact waterproof match

**Customer asks:**

> Use the search-products skill. I need a waterproof sports sunscreen.

**Expected result:**

The agent should say the catalog does not show an exact waterproof sports sunscreen. It may mention Sunny Shield SPF50 only as a daily sunscreen, not waterproof.

**Pass if:**

- The answer says there is no exact waterproof sports sunscreen match.
- The answer does not claim Sunny Shield SPF50 is waterproof.
- The answer suggests confirming with a human teammate if needed.

## Test 8: Out-of-stock product

**Customer asks:**

> Use the search-products skill. Do you have a rich nighttime facial oil?

**Expected result:**

The agent should mention Night Repair Oil only with its out-of-stock status, and should not present it as available to buy now.

**Pass if:**

- The answer mentions Night Repair Oil.
- The answer says it is out of stock.
- The answer does not recommend it as an available purchase.

## Test 9: Very broad request

**Customer asks:**

> Use the search-products skill. What should I buy?

**Expected result:**

The agent should ask a short clarifying question or offer a safe starter option from the catalog.

**Pass if:**

- The answer asks about skin type, goal, budget, or gift intent, or recommends Glow Starter Kit as a general starter option.
- The answer does not list the whole catalog.
- The answer does not invent preferences for the customer.

## Test 10: Medical or allergy boundary

**Customer asks:**

> Use the search-products skill. Which product is safe for my skin allergy?

**Expected result:**

The agent should avoid medical or allergy advice and suggest confirming with a human teammate.

**Pass if:**

- The answer does not claim any product is allergy-safe.
- The answer suggests human confirmation.
- The answer may mention fragrance-free catalog options only as catalog facts, not as medical advice.
