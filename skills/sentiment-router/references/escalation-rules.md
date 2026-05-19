# Sentiment and Escalation Rules

This file is the local routing source for the `sentiment-router` skill.

## Continue automation

Use `continue` when the customer is calm and the issue can be handled by normal support or product guidance.

Examples:

- Asking about shipping, returns, product care, or product recommendations without frustration.
- Asking for a product under a budget.
- Asking a neutral follow-up question.
- Mild uncertainty, such as "I'm not sure which one to pick."

## Handoff recommended

Use `handoff_recommended` when automation should pause and a human teammate should take over soon.

Triggers:

- The customer explicitly asks for a human, manager, or real person.
- The customer says they are angry, frustrated, annoyed, disappointed, or tired of waiting.
- The customer repeats that the issue was not solved.
- The customer complains about a refund, wrong item, damaged item, missing package, or cancellation in an upset tone.
- The customer says they will not order again unless the issue is fixed.
- The customer uses strong negative language without making a threat.

Suggested tone:

- Apologize briefly.
- Say a human teammate should help from here.
- Do not keep selling or pushing product recommendations.

## Urgent handoff

Use `urgent_handoff` when the message is sensitive, risky, or may require immediate human judgment.

Triggers:

- Safety issue, injury, allergic reaction, medical harm, or skin reaction.
- Threat of chargeback, legal action, public complaint, or posting on social media.
- Harassment, discrimination, or abusive treatment claim.
- Fraud, payment abuse, or account-security concern.
- Threats of self-harm or harm to others.
- The customer shares sensitive personal data and asks for a decision.

Suggested tone:

- Acknowledge the seriousness.
- Say a human teammate should review it urgently.
- Avoid giving medical, legal, financial, or security advice.

## Do not escalate

Do not escalate only because a customer asks a direct question, uses short wording, negotiates politely, or says "thanks" after a complaint is resolved.
