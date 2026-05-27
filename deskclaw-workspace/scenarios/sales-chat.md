# Sales Chat Scenario

A customer looking for product recommendations. Tests `search-products` skill with varying specificity.

## Conversation

**Customer:** Hi! I'm looking for something for my oily skin. What do you recommend?

**Customer:** That sounds good. Do you have sunscreen too? I need something for my morning routine.

**Customer:** Actually, my friend has really dry skin. What would be a good gift for her under NT$800?

**Customer:** Does that come with gift wrapping?

## Expected behavior

- Agent recommends Clear Day Gel Moisturizer, then Sunny Shield SPF50, then Travel Mini Trio (noting low stock).
- Agent answers the gift wrapping question from faq.md (not available).
- Agent does not invent products, discounts, or gift wrapping options.
