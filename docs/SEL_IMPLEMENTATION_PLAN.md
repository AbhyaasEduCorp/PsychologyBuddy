# SEL Integration — Detailed Implementation Plan
### Psychology Buddy · Emotional Intelligence Development Platform

**Objective:** Transform the existing tool-based mental health app into a structured Emotional Intelligence (EQ) development platform for adolescents (13–18 years) by enhancing current features with SEL logic — without adding unnecessary complexity.

**Framework:** CASEL (structure) + Apni Shala (cultural engagement) + ISELF (growth tracking)

**Core Principle:** We are not adding new features. We are enhancing existing ones with SEL logic.

---

## Competency Map

| Code | SEL Competency | What it Builds |
|------|---------------|----------------|
| SA | Self-Awareness | Naming emotions, identifying triggers, recognising strengths |
| SM | Self-Management | Regulating emotions, building coping habits, self-discipline |
| SOC | Social Awareness | Empathy, perspective-taking, understanding others |
| RS | Relationship Skills | Communication, help-seeking, conflict navigation |
| RD | Responsible Decision-Making | Values-based choices, understanding consequences |

---

Quick rundown of how the five CASEL skills are computed and surfaced in the prototype:

The five domains (tracked as 0–100 scores):

SA Self-Awareness
SM Self-Management
SOC Social Awareness
RS Relationship Skills
RD Responsible Decision-Making
How a score moves (signal sources):

Mood check-ins → primary emotion + nuance pick credits SA (naming the feeling) and the follow-up reflection prompt credits SM (regulation attempt).
Buddy chat turns → the Validate→Reflect→Act loop tags each user reply: reflection answers add to SA/SM, perspective-taking prompts add to SOC, repair/role-play scenarios add to RS, and "what will you try?" commitments add to RD.
Coping-tool usage → completing a surfaced tool (breathing, reframe, reach-out) credits the domain that tool maps to (e.g., reach-out → RS).
Decision scenarios → branching choice exercises feed RD.
Aggregation: each signal is a small weighted delta (≈1–5 pts) applied with decay over a rolling 14-day window, so the card reflects recent growth rather than lifetime totals. No averaging across kids, no leaderboards.

Visual representation (ISELF Growth Card):

Five labeled progress bars (one per domain), with the current value and a subtle Δ since last week arrow — green up, muted down, dot for steady.
The CASEL map at the top uses the same scores to size/saturate each node, so a stronger domain looks fuller; tapping a node opens its recent contributing moments (which check-in or chat earned the points).
Tone is descriptive ("you've been noticing your feelings more this week"), never ranked or graded.

# PHASE 1 — Foundation
## Map all features to SEL domains and enhance core interactions

---

## 1. Mood Check-In
**Current:** Students pick a basic emotion label daily.
**SEL Domain:** Self-Awareness (primary) · Self-Management (secondary)

### Implementation Ideas

**A. Expand the Emotion Vocabulary (Two-Layer Picker)**
Currently uses broad labels (Happy, Sad, Anxious). Research shows students with richer emotional vocabulary have significantly higher EQ. Add a second layer:

```
Layer 1 (Primary)      Layer 2 (Nuanced)
Sad            →       Disappointed / Lonely / Hopeless / Grief
Anxious        →       Worried / Nervous / Overwhelmed / Panicked
Angry          →       Frustrated / Irritated / Betrayed / Hurt
Happy          →       Relieved / Excited / Proud / Grateful / Content
```

Students pick primary → optionally drill into nuance. No forced depth — the second layer is optional but always available.

**B. Post-Check-In Micro-Reflection (30 seconds)**
After logging a mood, show one contextual prompt. Rotate based on the emotion picked:
- Anxious → *"What's one thing making you feel this way right now?"*
- Sad → *"Is this feeling about something specific or more general?"*
- Angry → *"Did something happen, or has it been building up?"*
- Happy → *"What contributed to this feeling today?"*

This turns a passive log into an active SA exercise without adding load.

**C. Emotion-to-Tool Routing**
After a negative mood is logged, immediately surface a contextually relevant tool:

| Mood Logged | Suggested Tool |
|------------|---------------|
| Anxious / Panicked | 5-minute breathing exercise |
| Sad / Lonely | Journaling prompt: "What do you need right now?" |
| Overwhelmed | 10-minute guided meditation |
| Frustrated / Angry | Music playlist: calm/release |
| Tired / Exhausted | Body scan meditation |

This bridges the SA competency (I noticed how I feel) to SM (I chose a coping action).

**D. Pattern Feedback After 7 Days**
Once a student has 7+ check-ins, show a weekly insight card:
*"You've felt anxious 4 times this week, mostly on weekday mornings. That's a pattern worth noticing."*
Links daily SA practice to longer-term self-understanding.

---

## 2. AI Chatbot — Buddy
**Current:** Emotionally supportive conversational AI avoiding validation loops.
**SEL Domain:** SA · SM · SOC · RS · RD (all five — the highest-leverage feature)

### Implementation Ideas

**A. SEL Domain Detection Per Conversation**
Classify each conversation into its primary SEL domain based on the topic:
- *"I failed my exam"* → SM (coping with setback)
- *"My friend ignored me"* → SOC + RS (social conflict)
- *"I don't know what to do"* → RD (decision support)
- *"I hate myself"* → SA + crisis

Use this classification to subtly steer the conversation technique:
- SA topics → use reflection and observation moves
- SOC/RS topics → use perspective-taking prompts
- RD topics → use values clarification questions

**B. Perspective-Taking Prompts for Social Conflicts**
When the conversation involves a friend, classmate, teacher, or family conflict, introduce one perspective-taking move:

Examples:
- *"What do you think was going on for them when that happened?"*
- *"Is there anything they might have been dealing with that you don't know about?"*
- *"If you were in their position, what might have been going through your mind?"*

This directly builds Social Awareness — the most under-served SEL competency in mental health apps.

**C. Structured Response Flow: Validate → Reflect → Action**
Encode the SEL learning cycle into conversation structure:
1. **Validate** the emotion briefly (not more than once)
2. **Reflect** — help the student understand what's happening and why
3. **Action** — close with one concrete micro-step or coping suggestion

Example:
- User: *"My friend ignored me at lunch and I feel terrible."*
- Validate: *"That stings — especially when it's someone you care about."*
- Reflect: *"Has this happened before, or did something feel different today?"*
- Action: *"What's one small thing you could do before tomorrow — even just writing it out?"*

**D. Pre-Escalation Emotional Check**
Before the AI triggers a counsellor escalation, insert one grounding step:
*"Before I loop in support, let's try one thing together. Can you take 3 deep breaths with me, then tell me — what's the most urgent thing you need right now?"*

This serves two purposes: immediate de-escalation attempt + gathering better context for the counsellor.

**E. Post-Session SEL Label**
After each session ends, show a 2-line card:
*"Today you worked on: Social Awareness — Understanding a relationship challenge."*
*"One thing to try: Write one sentence about their possible perspective."*

Makes the SEL practice visible and intentional to the student.

---

## 3. Journaling (Writing, Audio, Art)
**Current:** Free-form expression in three modalities.
**SEL Domain:** Self-Awareness (primary) · Self-Management · Relationship Skills

### Implementation Ideas

**A. Daily SEL-Guided Prompts (CBT-Based)**
Replace or supplement the blank journal with a rotating daily prompt matched to a SEL competency. Prompts should be 1 sentence, conversational in tone, never clinical.

**Self-Awareness prompts:**
- *"Describe a moment today where you reacted more strongly than you expected. What triggered it?"*
- *"What emotion showed up most today? Where did you feel it in your body?"*
- *"What are you most proud of about yourself this week — even something small?"*

**Self-Management prompts:**
- *"What is one thing you did today to cope with a difficult feeling — even if it wasn't perfect?"*
- *"When you felt overwhelmed today, what helped even a little?"*
- *"What habit do you wish you could build? What gets in the way?"*

**Social Awareness prompts:**
- *"Describe someone who reacted in a way that confused or hurt you. What might have been happening for them?"*
- *"Who did you notice was having a hard time today? How did that make you feel?"*
- *"Think of a time you misjudged someone. What did you learn?"*

**Relationship Skills prompts:**
- *"Describe a conversation that went well or badly this week. What made the difference?"*
- *"Is there something you've been wanting to say to someone but haven't? What's holding you back?"*

**Decision-Making prompts:**
- *"Was there a moment today where you had to make a choice? How did you decide?"*
- *"Is there a decision you're currently avoiding? What's the fear behind it?"*

**B. Emotion Tag on Entry**
Before writing, student selects: *"I'm writing from a place of..."* — with 5–6 emotion options. This primes self-awareness before expression and creates SEL-domain metadata per entry.

**C. Reflection Depth Signal**
Track entry length and frequency as a proxy for reflection depth (not shared with anyone — internal metric only). Used in the ISELF progress layer to show growth in reflection engagement over time.

**D. Audio and Art Journal — SEL-Aware Opening Prompt**
Before recording or drawing, show a brief SEL question:
- Audio: *"What would you say out loud that you haven't been able to say to anyone?"*
- Art: *"Draw how your day felt — not what it looked like, how it felt."*

---

## 4. Psychoeducation Library
**Current:** Admin-created articles on mental health topics with a clean reading experience.
**SEL Domain:** SA · SOC · RD (knowledge foundation for all competencies)

### Implementation Ideas

**A. SEL Competency Tag on Every Article**
Tag each article with its primary SEL competency. Students can filter the library by what they want to develop. Example filters:
- *"Help me understand myself"* → SA articles
- *"Help me understand others"* → SOC articles
- *"Help me handle conflict"* → RS articles

**B. Convert Key Articles to Interactive Scenario Format**
For high-impact topics (peer pressure, conflict, anxiety, decision-making), create a parallel interactive version:

Structure:
1. **Scene** — A short, realistic situation (2–3 sentences). Culturally grounded language.
2. **Pause** — *"What do you think is happening here?"*
3. **Reveal** — Show what was actually going on emotionally for each person
4. **Reflect** — *"Has something like this happened to you?"*
5. **Skill tip** — One practical takeaway

Example topic: *"Aisha's friend stopped talking to her suddenly."*
- Scene: Aisha sent a message, no reply for 3 days. She feels ignored and angry.
- Pause: *"What do you think Aisha should do? What might her friend be feeling?"*
- Reveal: Her friend was dealing with a family crisis and had shut down completely.
- Reflect: *"Have you ever been on either side of this?"*
- Skill tip: *"Before assuming someone is ignoring you, ask once — gently."*

**C. Perspective-Taking Story Series: "Inside Their Head"**
A dedicated article category showing the same situation from two different points of view — side by side. Directly builds SOC through narrative empathy.

---

## 5. Badges and Streaks
**Current:** 6 badge types awarded automatically for activity thresholds.
**SEL Domain:** Self-Management (discipline, consistency, habit formation)

### Implementation Ideas

**A. Map Each Badge to a SEL Competency — Make It Visible**
When a badge is awarded, the popup shows:
- Badge name + image
- SEL competency: *"You earned this for Self-Management — 7 days of coping tool use"*
- One-line explanation: *"Consistently turning to healthy tools is a core emotional regulation skill."*

**B. SEL Challenge Badges (Weekly)**
Beyond threshold-based badges, add challenge-based badges that require a specific SEL action:
- *"Notice and name your emotion 5 times this week"* → SA Challenge Badge
- *"Use a coping tool within 1 hour of logging a negative mood — 3 times"* → SM Challenge Badge
- *"Complete one perspective-taking journal prompt"* → SOC Challenge Badge
- *"Read one article and write 3 sentences about how it connects to your life"* → SA+SOC Badge

Challenges refresh weekly. Students see the active challenge on their dashboard.

**C. Streak Meaning — Not Just Days**
Currently streaks count consecutive days. Add a meaning layer:
- After a 7-day streak: *"7 days of showing up for yourself — that's what self-management looks like."*
- After a 14-day streak: *"Two weeks. That's a habit forming."*
- After a streak break: *"It broke — and that's okay. What made this week harder?"* (links to a journal prompt instead of just resetting)

---

## 6. Meditation Tools
**Current:** Guided sessions and breathing exercises with session tracking.
**SEL Domain:** Self-Management (primary) · Self-Awareness (secondary)

### Implementation Ideas

**A. Context-Based Suggestions**
Route students to specific sessions based on their emotional context:
- After journaling about anger → *"Try: Release & Reset — 5 minutes"*
- After logging overwhelmed → *"Try: Box Breathing for Exams — 3 minutes"*
- After a difficult chat session → *"Try: Body Scan — let your body catch up"*

**B. Pre-Session Mood Capture + Post-Session Comparison**
Before session: *"How are you feeling right now? (1 tap)"*
After session: *"How are you feeling now?"*
Show the delta: *"You moved from Overwhelmed → Calm in 8 minutes."*

This creates a direct, visible link between SM action (meditation) and emotional outcome — the most powerful learning reinforcement possible.

**C. SEL Label on Session Completion**
After each session: *"You just practised Self-Management. Regulating your nervous system is a skill — and you used it today."*

---

## 7. Music Therapy
**Current:** Curated mood-based playlists with session tracking.
**SEL Domain:** Self-Management · Self-Awareness

### Implementation Ideas

**A. Mood-to-Playlist Intelligent Routing**
After a mood check-in, suggest a specific playlist with a reason:
- Anxious → *"Calm Focus — reduces cortisol response"*
- Sad → *"Gentle Release — lets you feel without getting stuck"*
- Angry → *"Energy Shift — move the feeling through"*
- Happy → *"Momentum — keep this energy going"*

**B. Intentional Listening Prompt**
Before a playlist starts, one line: *"As you listen, notice if anything in you shifts — even slightly."*
After the session: *"What, if anything, changed?"* (optional, 1-tap response)

This turns passive listening into an SA + SM exercise.

---

# PHASE 2 — Experience Layer
## Introduce SEL Pathways and scenario-based interactions

---

## 8. SEL Pathways (New Experience Layer Using Existing Features)

**What this is:** Guided learning journeys that sequence existing features into a structured EQ development experience. Students choose a pathway and the app guides them through a 2–4 week programme using tools they already have access to.

**Design principle:** 30–60 second interactions. Minimal text. Emotion-first.

---

### Pathway 1 — Understanding Myself
**SEL Domain:** Self-Awareness
**Duration:** 2 weeks · 5 minutes/day

| Week | Activity Sequence |
|------|------------------|
| Week 1 | Mood check-in (2-layer) → Daily SA journal prompt → Pattern review at day 7 |
| Week 2 | Emotional Patterns Dashboard review → Body scan meditation → Reflection: "What did I learn about myself?" |

Key milestones:
- Name 10 different emotions across 14 days
- Complete 5 SA journal entries
- Review emotional pattern chart once

---

### Pathway 2 — Handling My Emotions
**SEL Domain:** Self-Management
**Duration:** 2 weeks · 5 minutes/day

| Week | Activity Sequence |
|------|------------------|
| Week 1 | Mood log → Emotion-to-tool routing → Use suggested tool → Post-tool mood comparison |
| Week 2 | Build a personal coping toolkit (choose 3 tools) → Practice trigger → tool → regulation loop |

Key milestones:
- Use a coping tool within 1 hour of a negative mood log — 5 times
- Complete a 7-day streak
- Build personal coping toolkit

---

### Pathway 3 — Understanding Others
**SEL Domain:** Social Awareness
**Duration:** 2 weeks · 5 minutes/day

| Week | Activity Sequence |
|------|------------------|
| Week 1 | SOC journal prompt daily → Read 2 perspective-taking articles → Scenario interaction |
| Week 2 | Chatbot conversation on a social challenge → Perspective-taking move in conversation → Reflection journal |

Key milestones:
- Complete 3 SOC journal prompts
- Engage with 2 scenario-based articles
- Have one chatbot conversation that includes a perspective-taking reflection

---

### Pathway 4 — Handling Relationships
**SEL Domain:** Relationship Skills
**Duration:** 2 weeks · 5 minutes/day

| Week | Activity Sequence |
|------|------------------|
| Week 1 | RS journal prompt → Read communication/conflict article → Scenario interaction |
| Week 2 | Chatbot: discuss a real relationship challenge → Post-session reflection card → Action step |

Key milestones:
- Journal about a relationship challenge 3 times
- Complete one scenario-based article
- Identify one communication action to try in real life

---

### Pathway 5 — Making Decisions
**SEL Domain:** Responsible Decision-Making
**Duration:** 2 weeks · 5 minutes/day

| Week | Activity Sequence |
|------|------------------|
| Week 1 | Values clarification exercise (one-time) → RD journal prompt daily → Decision scenario article |
| Week 2 | Choice simulation interaction → Chatbot: discuss a current decision → Reflection on values vs. choice |

Key milestones:
- Complete values clarification
- Engage with 2 decision scenario articles
- Journal about a real decision using values as a lens

---

### Pathway UX Design Principles
- Student chooses a pathway from their dashboard
- Daily nudge: *"Your Pathway 2 activity for today is ready — 4 minutes"*
- Progress shown as a journey map (not a percentage bar)
- Completing a pathway unlocks a SEL Achievement Badge
- Pathways can be repeated — growth is cumulative, not one-time

---

## 9. Scenario-Based Micro-Learning (Article Enhancement)

**What this adds:** Interactive decision and perspective scenarios embedded inside the psychoeducation library. Not new pages — enhanced versions of existing articles.

### Format: Choice Simulation

Present a realistic adolescent situation. Student makes a choice. App shows consequence + reflection.

Example — *"The Group Chat"*:
> Priya is added to a group chat where classmates are mocking a quiet student in their class. She reads it and feels uncomfortable.

**What does she do?**
- A) Send a laughing emoji to fit in
- B) Leave the group silently
- C) Say something in the chat
- D) Screenshot and tell a teacher

Each choice leads to a 2-sentence outcome + reflection:
*"She left silently. The mocking continued for 3 more days. She felt relieved she didn't join in, but also guilty for not acting."*

Reflection: *"What would you have done? What made it hard?"*

No right/wrong. The goal is reflection, not scoring.

---

# PHASE 3 — Advanced Layer
## High-impact additions that complete the EQ development loop

---

## 10. "I Need Help Now" Button
**SEL Domain:** SM · RS · RD
**Purpose:** Immediate emotional support for high-intensity moments — panic, overwhelm, acute distress.

### Design Principles
- Always visible (persistent button on student dashboard)
- Activates in under 3 taps
- 30–60 second maximum time to first grounding action
- Non-clinical language. Teen-friendly tone.

### Flow

**Step 1 — What's happening? (1 tap)**
> "What best describes right now?"
> - I'm panicking
> - I'm really angry
> - I feel like crying
> - I feel numb / shut down
> - I don't know

**Step 2 — Immediate Grounding (auto-selected by response)**

| Response | Grounding Action |
|---------|-----------------|
| Panicking | 4-7-8 breathing animation (60 seconds) |
| Really angry | Physical release prompt: *"Clench your fists tight for 5 seconds. Release. Repeat 3 times."* |
| Feel like crying | Permission to feel: *"It's okay. You don't have to hold it. Let it come."* + soft music |
| Numb / shut down | Sensory grounding: 5-4-3-2-1 technique (name 5 things you can see, etc.) |
| Don't know | Body check: *"Put one hand on your chest. What do you notice?"* |

**Step 3 — After 60 seconds — Check In**
> "How are you right now?"
> - A bit better
> - Still struggling
> - I need to talk to someone

**If "Still struggling" or "Need to talk":**
→ Open Buddy chat with context pre-loaded: *"A student used the emergency support button"*
→ Option to escalate to counsellor with one tap

**Step 4 — After the moment passes**
Next time the student opens the app: *"You used emergency support earlier. How are you feeling now?"*
→ Links to a short journal prompt: *"What helped? What was hardest?"*

This closes the SM loop: notice → act → reflect.

---

## 11. Progress Tracking — ISELF Layer
**Purpose:** Show students how they are growing emotionally over time. Display as growth, not performance. No scores. No grades.

### What Gets Tracked (Internal Signals)

| Signal | What It Measures | SEL Competency |
|--------|-----------------|----------------|
| Mood check-in frequency | Consistency of self-monitoring | SA |
| Emotion vocabulary breadth | Range of emotions named | SA |
| Journal entry frequency + avg length | Depth of reflection | SA · SM |
| Coping tool usage after negative mood | Regulation in action | SM |
| Perspective-taking prompts engaged | Empathy practice | SOC |
| Pathway completion | Structured EQ development | All |
| Help-seeking (chat sessions + escalations) | Willingness to reach out | RS |
| Scenario/article interactions | Knowledge + application | RD · SOC |

### How It Displays (Student-Facing)

**Monthly SEL Growth Card** (not a dashboard — a single reflective card, shown at end of month):

```
Your emotional growth this month:

🪞 You named 12 different emotions — that's self-awareness in action.
🎛️ You used a coping tool 8 times after difficult moments.
🌐 You explored 3 perspective-taking scenarios.
🤝 You reached out for support twice — that takes courage.
⚖️ You completed the "Making Decisions" pathway.

One thing that stood out: You bounced back after 2 difficult weeks.
That's resilience.
```

Language principles:
- Growth framing: *"You did X"* not *"Your score is X"*
- No comparison to other students. Ever.
- Always ends with an encouraging observation
- Optional — student can choose not to see it

### Counsellor View (Per-Student)

The same signals surface as a professional SEL profile visible to the counsellor:
- Emotional awareness trend (is vocabulary growing?)
- Coping adoption rate (are they using tools when distressed?)
- Reflection depth (journal length trend)
- Help-seeking pattern (are they reaching out or withdrawing?)
- Engagement drop signals: *"Activity declined significantly this week"*

This gives counsellors a structured lens for session planning beyond just escalation alerts.

---

## 12. Counsellor Escalation — SEL-Enhanced
**Current:** AI detects crisis → counsellor alert → session scheduled.
**SEL Domain:** RS · RD

### Implementation Ideas

**A. Pre-Escalation Emotional Prompt**
Before the escalation alert fires, attempt one grounding step through the chat:
*"Before I connect you with support, I want to make sure you're as grounded as possible. Can we try one quick thing together?"*
→ 60-second breathing exercise
→ Then: *"Do you still want me to loop in a counsellor?"*

This gives the student agency in the process (RS + RD) and reduces unnecessary escalations.

**B. Student Escalation Brief**
After a counsellor alert is sent, show the student:
*"I've let a trusted adult know you needed support. Here's what happens next: [counsellor name] will be in touch. Your conversation with me stays private except for what was needed to keep you safe."*

Transparency builds trust in the relationship with the school.

**C. Post-Escalation Reflection Journal (7 Days Later)**
One week after the escalation is resolved, prompt a structured reflection:
- *"A week ago you went through something really hard. How are you feeling now?"*
- *"What helped during that time?"*
- *"What would you want to remember for next time?"*

This closes the RD loop: experience → reflection → learning for future decisions.

**D. Counsellor SEL Goal Setting**
Counsellors can set a focused SEL pathway for a specific student:
- *"This month, [student] is working on Self-Management."*
- The platform surfaces SM-specific tools more prominently for that student
- Counsellor can see SM-related engagement in the student's activity view

---

# Implementation Priority Summary

## Phase 1 — Foundation (Immediate)
*Enhance existing features with SEL logic. No new screens needed.*

| Priority | Feature | Enhancement | SEL Domain |
|----------|---------|-------------|-----------|
| 1 | Mood Check-In | 2-layer emotion picker + micro-reflection | SA |
| 2 | Mood Check-In | Emotion-to-tool routing after negative mood | SM |
| 3 | Journaling | Daily SEL-guided prompts (CBT-based) | SA · SM · SOC · RS · RD |
| 4 | AI Chatbot | Perspective-taking prompts for social conflicts | SOC |
| 5 | AI Chatbot | Validate → Reflect → Action structure | SA · SM |
| 6 | Psychoeducation | SEL competency tag on all articles | All |
| 7 | Badges/Streaks | SEL label on every badge awarded | SM |
| 8 | Meditation/Music | Post-session mood comparison (before vs. after) | SM |

## Phase 2 — Experience Layer (Mid-term)
*Introduce SEL pathways and scenario interactions.*

| Priority | Feature | Enhancement | SEL Domain |
|----------|---------|-------------|-----------|
| 9 | SEL Pathways | 5 guided journeys using existing features | All |
| 10 | Psychoeducation | Scenario-based choice simulations | SOC · RD |
| 11 | Psychoeducation | Perspective-taking story series | SOC |
| 12 | Badges/Streaks | SEL Challenge Badges (weekly) | All |
| 13 | AI Chatbot | Post-session SEL label card | All |
| 14 | Counsellor System | Pre-escalation emotional prompt + student brief | RS · RD |

## Phase 3 — Advanced Layer (Long-term)
*Complete the EQ development loop with tracking and emergency support.*

| Priority | Feature | Enhancement | SEL Domain |
|----------|---------|-------------|-----------|
| 15 | "I Need Help Now" Button | New persistent emergency support flow | SM · RS |
| 16 | Progress Tracking | ISELF monthly growth card for students | All |
| 17 | Progress Tracking | Counsellor SEL profile view per student | All |
| 18 | Counsellor System | Post-escalation reflection journal | RD |
| 19 | Counsellor System | SEL goal setting per student | All |
| 20 | Mood Check-In | Weekly pattern insight after 7 check-ins | SA |

---

## Design Principles (Non-Negotiable Across All Phases)

- **30–60 second interactions** — every SEL touch should be completable in under 1 minute
- **Minimal text** — prompts are 1 sentence. Reflections are optional. Nothing is forced.
- **Emotion-first** — always start with the feeling, not the information
- **Non-judgmental tone** — no right/wrong answers. Ever. Growth framing only.
- **Optional depth** — every feature has a surface level (fast) and a deeper level (if the student wants it). Neither is penalised.
- **No performance scoring** — progress is shown as growth narrative, not percentage scores

---

## Strategic Outcome

```
Before Integration:
Student logs mood → opens a tool → uses it independently → closes app

After Integration:
Student logs mood → app notices the emotion → suggests a relevant pathway step
→ student engages with a guided SEL micro-interaction → Buddy conversation deepens the reflection
→ student takes one real-world action → counsellor sees the pattern → school adapts support
→ student sees their growth at month end → EQ develops over time
```

**From:** Mental health support app
**To:** Guided Emotional Intelligence Development Platform

---

*"SEL frameworks teach what emotional intelligence is. This app will teach users how to practice it in real time."*
