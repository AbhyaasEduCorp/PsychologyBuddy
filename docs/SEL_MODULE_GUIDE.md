# 📘 SEL & EQ Module Guide — Psychology Buddy

**Social Emotional Learning (SEL) delivery across all school levels, module by module.**

This document maps every platform module to its SEL competency, explains how it works at each school level (Student → Teacher → Counsellor → Admin → SuperAdmin), and identifies what is built vs. what should be prioritised next.

---

## SEL Competency Reference (CASEL Framework)

| Code | Competency | Core Skill |
|------|-----------|------------|
| **SA** | Self-Awareness | Identifying emotions, strengths, and values |
| **SM** | Self-Management | Regulating emotions and behaviour toward goals |
| **SOC** | Social Awareness | Empathy and perspective-taking |
| **RS** | Relationship Skills | Communication, help-seeking, conflict resolution |
| **RD** | Responsible Decision-Making | Safe, ethical, constructive choices |

---

## Module 1 — 💬 AI Chat Companion (Buddy)

**SEL Competencies:** SA · SM · SOC · RS · RD

### What It Does
Buddy is a conversational AI trained to move students from emotional expression → reflection → forward action. It never loops on validation templates. It uses curiosity, observation, and insight to build genuine self-understanding.

### Level-by-Level

| Level | Role in This Module | Current State |
|-------|-------------------|---------------|
| **Student** | Primary user — expresses emotions, receives reflective conversation | ✅ Fully built |
| **Teacher** | No touchpoint | ❌ Not connected |
| **Counsellor** | Receives chat session summaries after sessions end | ✅ Summaries generated |
| **Admin** | Can view chat activity metrics (session count, frequency) | ✅ Analytics available |
| **SuperAdmin** | Platform-wide chat engagement data | ✅ Available |

### SEL Delivery in This Module

- **SA** — Buddy asks *"What part of this hurt most?"* not *"How do you feel?"* — pushing students to name specifics, not generics
- **SM** — Conversations end with a coping suggestion tied to what was discussed
- **SOC** — Third-party safety rule: when a student mentions a friend's crisis, Buddy models taking others' pain seriously
- **RS** — Dependency Prevention Policy: Buddy consistently redirects students toward counsellors and trusted adults
- **RD** — Green/Yellow/Red content classifier blocks instructional harm while supporting the emotional experience

### Improvements to Prioritise
- Surface the SEL competency label after each session: *"Today you practised Self-Awareness"*
- Teacher receives a soft weekly signal: *"Your class had X chat sessions this week"* (no content)
- Post-session reflection card: 2-line summary + one coping action the student can take offline

---

## Module 2 — 😊 Mood Check-In

**SEL Competencies:** SA · SM

### What It Does
Students log their daily emotional state. Labels are stored per student and feed into the Emotional Patterns Dashboard, streak tracking, and counsellor monitoring.

### Level-by-Level

| Level | Role in This Module | Current State |
|-------|-------------------|---------------|
| **Student** | Logs mood daily; sees own history | ✅ Built |
| **Teacher** | No access | ❌ Not connected |
| **Counsellor** | Can see individual student mood history | ✅ Available |
| **Admin** | Aggregate mood distribution per school | ✅ In analytics |
| **SuperAdmin** | Network-wide mood trends | ✅ Available |

### SEL Delivery in This Module

- **SA** — The act of pausing and labelling an emotion is the foundational self-awareness practice
- **SM** — Negative mood check-ins should immediately surface a relevant coping tool (see improvement below)

### Improvements to Prioritise
- **Emotion vocabulary expansion** — Replace simple labels (Happy/Sad) with a 2-layer picker: primary emotion → nuanced sub-emotion (e.g. Sad → Disappointed / Lonely / Hopeless). Richer vocabulary = higher self-awareness
- **Emotion-to-Tool Routing** — After a negative mood is logged, auto-surface: *"You're feeling anxious — try the 5-minute breathing exercise"*
- **Teacher Class Snapshot** — Anonymous aggregate: *"Class 10B mood this Monday: 65% stressed."* No individual data, just class temperature

---

## Module 3 — 📊 Emotional Patterns Dashboard

**SEL Competencies:** SA · SM

### What It Does
A student-facing pie chart showing their dominant emotional triggers over the past month, paired with a written monthly insight and a personalised recommendation.

### Level-by-Level

| Level | Role in This Module | Current State |
|-------|-------------------|---------------|
| **Student** | Views their own trigger breakdown and insight | ✅ Built |
| **Teacher** | No access | ❌ Not connected |
| **Counsellor** | No dedicated view of this data per student | ⚠️ Data exists, no UI |
| **Admin** | No school-wide trigger pattern view | ⚠️ Data exists, no UI |
| **SuperAdmin** | No network view | ❌ Not built |

### SEL Delivery in This Module

- **SA** — Students see patterns, not just moments. Knowing *"anxiety is my #1 trigger, appearing 40% of the time"* is a qualitatively different form of self-knowledge than remembering individual bad days
- **SM** — The recommendation section directly links the pattern to an action

### Improvements to Prioritise
- **Counsellor SEL Profile View** — Surface emotional pattern data per student inside the counsellor dashboard so it informs session planning
- **Admin School Trigger Report** — Show which emotions are most common school-wide per month (anonymous aggregate), helping admin understand the school's emotional climate
- **Term-over-Term Comparison** — Show students their own pattern from last month vs. this month: *"Your anxiety triggers reduced from 42% to 28% — here's what changed"*

---

## Module 4 — 📝 Journaling (Writing, Audio, Art)

**SEL Competencies:** SA · SM · RS

### What It Does
Three expression modalities — written text, voice recording, and drawing — giving every student a way to externalise internal states that matches their natural style.

### Level-by-Level

| Level | Role in This Module | Current State |
|-------|-------------------|---------------|
| **Student** | Creates journal entries freely | ✅ Built |
| **Teacher** | Cannot assign journal prompts | ❌ Not connected |
| **Counsellor** | Cannot view journals (privacy protected) | ✅ Correct by design |
| **Admin** | Can see journal activity counts per school | ✅ In analytics |
| **SuperAdmin** | Platform-wide journaling engagement | ✅ Available |

### SEL Delivery in This Module

- **SA** — Free writing externalises thought, making patterns visible to the student themselves
- **SM** — Art and audio journals specifically serve students who struggle to regulate through text — multimodal coping
- **RS** — Writing about relationship conflicts builds the habit of articulating relational experiences

### Improvements to Prioritise
- **Guided SEL Prompts** — Replace blank page with daily rotating prompts aligned to competencies:
  - *SA: "Describe a moment today where you reacted strongly. What triggered it?"*
  - *SM: "What is one thing you did today to manage how you were feeling?"*
  - *RS: "Describe a conversation that went well or badly. What made the difference?"*
  - *RD: "Was there a moment today where you had to make a choice? What helped you decide?"*
- **Teacher Assignment Tool** — Teachers can push a specific prompt to their class as a homework activity, tied to a lesson theme
- **SEL Tag on Entries** — Let students optionally tag which competency they were working on

---

## Module 5 — 🧘 Meditation Tools

**SEL Competencies:** SM · SA

### What It Does
Guided meditation sessions, breathing exercises, and mindfulness practices with session duration tracking.

### Level-by-Level

| Level | Role in This Module | Current State |
|-------|-------------------|---------------|
| **Student** | Uses sessions independently | ✅ Built |
| **Teacher** | No ability to recommend or assign | ❌ Not connected |
| **Counsellor** | Can see if a student uses meditation after crisis | ✅ In activity data |
| **Admin** | Meditation session counts in analytics | ✅ Available |
| **SuperAdmin** | Network-wide meditation engagement | ✅ Available |

### SEL Delivery in This Module

- **SM** — Breathing exercises and mindfulness directly train physiological regulation — the biological foundation of emotional self-management
- **SA** — Body-scan meditations build interoceptive awareness (noticing physical signals of emotion)

### Improvements to Prioritise
- **Mood-Linked Sessions** — After logging anxious/stressed mood, surface a specific session: *"3-minute breathing exercise for exam stress"*
- **Teacher Class Calm** — Admin enables a *"Class Reset"* feature: teacher triggers a 2-minute breathing exercise for the whole class at the start of a period, tracked as a group session

---

## Module 6 — 🎵 Music Therapy

**SEL Competencies:** SM · SA

### What It Does
Curated mood-based playlists for relaxation, focus, and emotional regulation. Session tracking and analytics.

### Level-by-Level

| Level | Role in This Module | Current State |
|-------|-------------------|---------------|
| **Student** | Browses and plays playlists by mood | ✅ Built |
| **Teacher** | No connection | ❌ Not connected |
| **Counsellor** | Activity visible in student summary | ✅ Available |
| **Admin** | Usage counts in analytics | ✅ Available |
| **SuperAdmin** | Network engagement data | ✅ Available |

### SEL Delivery in This Module

- **SM** — Intentional music selection for mood regulation is itself an SM skill: choosing an intervention to shift your state
- **SA** — Picking a playlist requires the student to first identify what they feel and what they need

### Improvements to Prioritise
- **Mood-to-Playlist Routing** — Same as meditation: negative mood check-in → auto-suggest a playlist
- **Playlist Reflection Prompt** — After a session ends: *"How are you feeling now compared to when you started?"* (1-tap mood comparison)

---

## Module 7 — 📚 Psychoeducation Library

**SEL Competencies:** SA · SOC · RD

### What It Does
A content management system for mental health articles, with a block-based editor, category tagging, and a student-facing reading experience.

### Level-by-Level

| Level | Role in This Module | Current State |
|-------|-------------------|---------------|
| **Student** | Reads articles at own pace | ✅ Built |
| **Teacher** | Cannot assign articles to a class | ❌ Not connected |
| **Counsellor** | Can recommend articles informally | ⚠️ No in-platform mechanism |
| **Admin** | Creates and publishes articles | ✅ Built |
| **SuperAdmin** | Platform-wide content management | ✅ Built |

### SEL Delivery in This Module

- **SA** — Articles on anxiety, depression, and stress build conceptual vocabulary for naming internal states
- **SOC** — Articles on peer pressure, family dynamics, and social relationships build perspective-taking capacity
- **RD** — Decision-focused articles (how to say no, recognising unsafe situations) directly teach responsible choice-making

### Improvements to Prioritise
- **SEL Competency Tags** — Tag every article with its primary SEL competency so students can intentionally browse by what they want to develop
- **Teacher Assignment** — Teachers select an article and assign it to their class with a due date; completion is tracked
- **Counsellor Prescription** — Counsellor recommends a specific article to a student from within the counsellor dashboard; student sees it highlighted in their library
- **Perspective-Taking Content Category** — Dedicated article series: *"Inside Their Head"* — narrative-format stories showing how different people experience the same situation

---

## Module 8 — 🏆 Gamification (Badges & Streaks)

**SEL Competencies:** SM · SA

### What It Does
Six badge types (Streak, Journal Count, Article Read, Meditation, Music, Mood Check-In) awarded automatically when thresholds are met. Daily streak tracking across all activity types.

### Level-by-Level

| Level | Role in This Module | Current State |
|-------|-------------------|---------------|
| **Student** | Earns badges, maintains streaks, sees progress | ✅ Built |
| **Teacher** | No visibility | ❌ Not connected |
| **Counsellor** | Can see engagement patterns via activity data | ⚠️ Indirect only |
| **Admin** | Creates badge criteria, views achievement rates | ✅ Built |
| **SuperAdmin** | Platform-wide badge analytics | ✅ Available |

### SEL Delivery in This Module

- **SM** — Streaks require *consistent, self-initiated behaviour over time* — the purest form of self-management training
- **SA** — Each badge category implicitly labels the SEL competency being developed; making this explicit would amplify the effect

### Improvements to Prioritise
- **SEL Competency Label on Badges** — Badge earned popup shows: *"Self-Management streak — 7 days of coping tool use"*
- **Counsellor Engagement Alert** — If a student's streak drops to zero after 5+ days of consistent activity, counsellor gets a low-priority heads-up: *"Student engagement dropped this week"*
- **SEL Challenge Badges** — Weekly structured challenges with a badge reward: *"This week: notice and name your emotion 5 times"*

---

## Module 9 — 🛡️ Safety & Escalation System

**SEL Competencies:** RD · RS · SOC

### What It Does
AI-powered crisis detection in chat → automated escalation alert → counsellor notification (in-app + email) → session scheduling → resolution tracking.

### Level-by-Level

| Level | Role in This Module | Current State |
|-------|-------------------|---------------|
| **Student** | Triggers escalation through chat; unaware of backend process | ✅ Seamless |
| **Teacher** | Receives email notification for high/critical escalations | ✅ Built |
| **Counsellor** | Receives all alerts, schedules sessions, tracks resolution | ✅ Fully built |
| **Admin** | Views all school escalations, resolution status | ✅ Built |
| **SuperAdmin** | Network-wide escalation data and trends | ✅ Available |

### SEL Delivery in This Module

- **RD** — Crisis Safety Override: when high-risk language appears, all other rules are subordinated. Students experience that *some decisions are non-negotiable*
- **RS** — Help-seeking is met with a real, prompt, human response — reinforcing that relationships are safe and adults can be trusted
- **SOC** — Third-party safety rule teaches students to take others' distress seriously

### Improvements to Prioritise
- **Post-Crisis SEL Reflection** — 7 days after an escalation is resolved, prompt the student with a structured journal: *"What happened? What helped? What would you do differently?"* Closes the loop and builds agency
- **Trend Alert for Counsellors** — Not just crisis alerts, but *gradient* alerts: *"Student X has logged negative mood for 8 consecutive days with zero coping tool use"* — intervene before crisis
- **Student Escalation Awareness** — After the immediate crisis passes, a brief, age-appropriate explanation: *"I've let a trusted adult know you needed support. This is what they'll do next."* Builds trust in the process

---

## Module 10 — 📊 Analytics & Insights

**SEL Competencies:** All (measurement layer)

### What It Does
Student personal dashboards, counsellor activity views, admin school reports, and SuperAdmin network reports.

### Level-by-Level

| Level | Current Analytics | SEL Gap |
|-------|-----------------|---------|
| **Student** | Mood trends, tool usage, badge progress | No SEL competency framing |
| **Teacher** | Nothing | No class-level SEL view |
| **Counsellor** | Escalation history, session records | No SEL profile per student |
| **Admin** | Engagement metrics, content performance | No SEL health score |
| **SuperAdmin** | Platform-wide usage | No cross-school SEL benchmarking |

### Improvements to Prioritise (Highest ROI)

**Student SEL Progress Card** — A simple card on the student dashboard:
```
Your SEL this month:
🪞 Self-Awareness     ████████░░  8/10  (mood check-ins)
🎛️ Self-Management   ██████░░░░  6/10  (coping tool use)
📚 Social Awareness  ████░░░░░░  4/10  (articles read)
🤝 Relationship Skills ██████░░░░  6/10  (chat sessions)
⚖️ Decision-Making   ████████░░  8/10  (safety policy adherence)
```

**Counsellor SEL Profile** — Per-student view showing:
- Which competencies are strong vs. weak based on platform behaviour
- Mood trend over 3 months
- Coping tool adoption rate
- Help-seeking frequency

**Admin School SEL Dashboard** — One screen answering: *"How is SEL going at our school?"*
- % of students who completed at least 1 SEL activity this week
- Most common emotional trigger school-wide
- Coping tool adoption rate
- Escalation trend

**Teacher Class Mood Snapshot** — Anonymous weekly aggregate per class period

---

## SEL Delivery Summary by Level

| Module | Student | Teacher | Counsellor | Admin | SuperAdmin |
|--------|---------|---------|-----------|-------|------------|
| AI Chat Buddy | ✅ Full | ❌ None | ✅ Summaries | ✅ Metrics | ✅ Metrics |
| Mood Check-In | ✅ Full | ❌ None | ✅ History | ✅ Aggregate | ✅ Aggregate |
| Emotional Patterns | ✅ Full | ❌ None | ⚠️ No UI | ⚠️ No UI | ❌ None |
| Journaling | ✅ Full | ❌ None | ✅ Privacy OK | ✅ Counts | ✅ Counts |
| Meditation | ✅ Full | ❌ None | ✅ Activity | ✅ Counts | ✅ Counts |
| Music Therapy | ✅ Full | ❌ None | ✅ Activity | ✅ Counts | ✅ Counts |
| Psychoeducation | ✅ Full | ❌ None | ⚠️ Informal | ✅ CMS | ✅ CMS |
| Gamification | ✅ Full | ❌ None | ⚠️ Indirect | ✅ Manage | ✅ Metrics |
| Escalation | ✅ Seamless | ✅ Email alerts | ✅ Full | ✅ Full | ✅ Full |
| Analytics | ✅ Personal | ❌ None | ⚠️ Partial | ✅ School | ✅ Network |

**Legend:** ✅ Built and functional · ⚠️ Data exists, UI/integration missing · ❌ Not built

---

## Implementation Priority Order

### Phase 1 — Quick Wins (Low dev effort, high SEL impact)
1. **Emotion-to-Tool Routing** — Negative mood → auto-suggest relevant tool
2. **SEL label on every activity** — *"You just practised Self-Management"*
3. **Guided journal prompts** — Replace blank page with rotating SEL prompts
4. **SEL competency tags on articles** — Filter library by competency

### Phase 2 — School-Level SEL (Medium effort, unlocks teacher + counsellor layer)
5. **Teacher class mood snapshot** — Anonymous weekly aggregate per class
6. **Counsellor SEL student profile** — Trend-based early warning view
7. **Teacher article/journal assignment tool** — Classroom SEL integration
8. **Post-crisis SEL reflection journal** — Closes the escalation loop

### Phase 3 — Institutional SEL (Higher effort, long-term impact)
9. **Admin school SEL dashboard** — School-wide health score
10. **Student SEL progress card** — Personal competency tracker
11. **SEL curriculum builder for admins** — Term-based programme planning
12. **Cross-school SEL benchmarking** — SuperAdmin network report

---

*Psychology Buddy — SEL is not a feature. It is the architecture.*
