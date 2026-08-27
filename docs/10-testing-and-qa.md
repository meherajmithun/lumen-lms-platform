# 10 — Testing & QA

Time is short, so tests are targeted at the two things that are (a) pure logic and (b)
directly graded: **grading maths** and **RBAC leaks**.

---

## 1. Unit tests (Vitest, in `backend/`)

```bash
cd backend && npm i -D vitest
```

### `quiz.grade()` — the highest-value test in the project
| Case | Expected |
|------|----------|
| All answers correct | score 100, `passed` true |
| All wrong | score 0, `passed` false |
| 3 of 5 correct | score 60 |
| A question left unanswered | counted wrong, not skipped |
| Payload contains an unknown `questionId` | ignored |
| Payload omits questions entirely | all wrong, score 0 |
| Quiz with **zero** questions | score 0, no `NaN`, no throw |
| Duplicate answers for one question | first (or last) taken deterministically, never double-counted |
| `score` supplied in the request body | discarded; computed value stored |

### `getProgressFor()`
| Case | Expected |
|------|----------|
| 3 of 5 lessons complete | 60 |
| 0 of 5 | 0 |
| 5 of 5 | 100, enrollment marked `completed` |
| Course with 0 lessons | 0, no divide-by-zero |
| Progress rows from **another** student | excluded |
| Marking the same lesson twice | still one row, percentage unchanged |
| 1 of 3 | rounds to 33 (defined rounding, not floating drift) |

**Commit:** `test(backend): quiz grading and progress calculation`

---

## 2. The RBAC leak suite — `scripts/rbac-check.sh`

This is the artifact you put on screen for **V-3**. A bash script hitting Strapi directly
with curl, printing PASS/FAIL per assertion. Because it bypasses the frontend entirely, it
*is* the proof that enforcement is on the backend.

```bash
#!/usr/bin/env bash
# usage: bash scripts/rbac-check.sh https://your-app.up.railway.app
set -u
API="${1:-http://localhost:1337}"
PASS=0; FAIL=0

login() { curl -s -X POST "$API/api/auth/local" -H 'Content-Type: application/json' \
  -d "{\"identifier\":\"$1\",\"password\":\"$2\"}" | node -pe 'JSON.parse(require("fs").readFileSync(0)).jwt ?? ""'; }

expect_status() { # desc  expected  method  path  token  [body]
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -X "$3" "$API$4" \
    ${5:+-H "Authorization: Bearer $5"} -H 'Content-Type: application/json' ${6:+-d "$6"})
  if [ "$code" = "$2" ]; then echo "  PASS  $1 ($code)"; PASS=$((PASS+1));
  else echo "  FAIL  $1 — expected $2, got $code"; FAIL=$((FAIL+1)); fi
}

ADMIN=$(login admin@lms.test 'Passw0rd!')
CM=$(login cm@lms.test 'Passw0rd!')
INS_A=$(login instructor.a@lms.test 'Passw0rd!')
INS_B=$(login instructor.b@lms.test 'Passw0rd!')
STU=$(login student1@lms.test 'Passw0rd!')

echo "== anonymous =="
expect_status "anon cannot list users"            403 GET  /api/users            ""
expect_status "anon cannot create a course"       403 POST /api/courses          "" '{"data":{"title":"x"}}'

echo "== student =="
expect_status "student cannot create a course"    403 POST /api/courses          "$STU" '{"data":{"title":"x"}}'
expect_status "student cannot change roles"       403 PUT  /api/users/1/role     "$STU" '{"role":"admin"}'
expect_status "student cannot write a blog post"  403 POST /api/posts            "$STU" '{"data":{"title":"x","body":"y"}}'

echo "== content manager =="
expect_status "CM cannot list users"              403 GET  /api/users            "$CM"
expect_status "CM cannot enroll"                  403 POST /api/enrollments      "$CM" '{"data":{"course":"1"}}'

echo "== instructor cross-ownership =="
expect_status "instructor A cannot edit B's course" 403 PUT "/api/courses/$COURSE_B" "$INS_A" '{"data":{"title":"hacked"}}'
expect_status "instructor cannot write a blog post" 403 POST /api/posts          "$INS_A" '{"data":{"title":"x","body":"y"}}'

echo "== admin (matrix says no enroll / no quiz) =="
expect_status "admin cannot enroll"               403 POST /api/enrollments      "$ADMIN" '{"data":{"course":"1"}}'

echo "== data-shape assertions =="
curl -s "$API/api/quizzes/$QUIZ_ID/take" -H "Authorization: Bearer $STU" \
  | grep -q correctOptionId \
  && { echo "  FAIL  answer key leaked to student"; FAIL=$((FAIL+1)); } \
  || { echo "  PASS  no answer key in student quiz payload"; PASS=$((PASS+1)); }

curl -s "$API/api/posts?status=draft" | grep -q '"publishedAt":null' \
  && { echo "  FAIL  drafts visible publicly"; FAIL=$((FAIL+1)); } \
  || { echo "  PASS  drafts hidden from the public"; PASS=$((PASS+1)); }

echo; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
```

Run it against **local** during Phase 3 and against **production** in Phase 10.

**Commit:** `test: rbac leak check script`

---

## 3. Escalation & tamper tests (manual, but do them)

| Attack | Expected |
|--------|----------|
| Register with `{"role":"admin"}` | 400, or account created as student |
| Register with `{"role":"content_manager"}` | rejected |
| `POST /enrollments` with `student: <another user id>` | the JWT's user is used, not the body |
| `POST /lessons/:id/complete` with `student` in the body | ignored |
| `POST /quizzes/:id/submit` with `{"score":100,"passed":true}` | stored score is the computed one |
| `GET /enrollments?filters[student]=<other id>` | still returns only your own |
| Copy the `lms_session` cookie into another browser | works (it's a session — expected); but **editing** its payload breaks the signature → treated as logged out |
| Call a Server Action directly via a crafted POST while logged in as the wrong role | `requireRole` rejects |
| Open a draft post's slug URL while logged out | 404 |

---

## 4. Manual role matrix walkthrough (30 min, before recording)

Log in as each role in a **separate browser profile** (so four sessions coexist) and tick
every cell of the PDF's matrix. Keep the four windows open — you'll use them in the video.

| Role | Must be able to | Must NOT be able to |
|------|-----------------|---------------------|
| Admin | manage users & roles; CRUD any course/lesson/quiz/post; see all progress; see stats | enroll; take a quiz |
| Content Manager | CRUD any course/lesson/quiz; CRUD blog; see student progress | reach `/admin/users`; enroll; take a quiz |
| Instructor | CRUD **own** courses/lessons/quizzes; see **own** students' progress | touch another instructor's course; write blog; manage users; enroll |
| Student | browse, enroll, view lessons of enrolled courses, mark complete, take quizzes, see own progress & results | any create/edit/delete; see other students' data; see drafts |

---

## 5. Cross-browser & responsive

- Chrome + Safari (macOS), and one mobile viewport via device emulation
- Breakpoints 360 / 768 / 1280
- Dark and light themes
- Keyboard-only pass on the critical path

---

## 6. Pre-submission smoke test (run on **production**, ~15 min)

1. Register a brand-new student → lands on the student dashboard
2. Browse `/courses` → enroll → appears in `/my-courses`
3. Open lesson 1 → mark complete → progress shows 1/N → **hard refresh** → still there
4. Complete all lessons → 100%
5. Take the quiz → score appears immediately → visible in `/results`
6. Log in as instructor → create a course, a lesson, a quiz → see the student in the roster
7. Log in as content manager → write a post → save as draft → confirm it 404s in incognito →
   publish → confirm it appears on `/blog`
8. Log in as admin → stats correct → promote a student to instructor → log in as that user →
   they now have the teach nav
9. `bash scripts/rbac-check.sh https://<railway-url>` → all PASS
10. Lighthouse on `/`, `/courses`, `/blog` → ≥90 performance & accessibility
