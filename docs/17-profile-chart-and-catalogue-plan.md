# Profile editing, chart axis, and enrolment indicators

## Outcome

Students can edit their display name, profile image URL, and short bio from **Your profile**. The learning consistency chart has a labelled time axis, and Browse clearly identifies courses the current student has already enrolled in.

## 1. Profile data and permissions

- Extend the Strapi user model with optional `bio` and `avatarUrl` fields.
- Add an authenticated `PUT /users/me/profile` endpoint that can only update the caller's own profile.
- Validate display names, bio length, and `http`/`https` avatar URLs on both the frontend and backend.
- Keep email, role, account ID, and all security fields read-only.
- Include the new profile fields in `GET /users/me` and grant the self-update action to every authenticated role.

## 2. Profile editing UI

- Load the current profile from Strapi on the account page.
- Add an accessible edit form for display name, avatar URL, and bio.
- Show the avatar image when configured and initials as a safe fallback.
- Save through a guarded Server Action, refresh the signed session's display name, and revalidate the account layout.
- Report success and validation failures without losing the current page.

## 3. Learning-time Y axis

- Preserve the existing per-day bars and UTC date labels.
- Add horizontal guides and left-side labels for zero, half of the current maximum, and the maximum learning time.
- Use human-readable seconds/minutes/hours so short sessions remain visible and understandable.
- Keep each bar keyboard focusable with its exact duration in the accessible label.

## 4. Browse enrolment awareness

- On `/courses`, fetch the signed-in student's own enrolments alongside the public catalogue.
- Build a set of enrolled course document IDs and pass that status into each matching course card.
- Display a high-contrast `Enrolled` badge without removing the course from search/filter results.
- Degrade safely to the normal public catalogue for signed-out users or an expired session.

## 5. Verification

- Run frontend lint, TypeScript, and production build.
- Run backend tests, TypeScript, and build.
- Confirm profile ownership/validation, chart labels at zero and non-zero histories, and enrolled/non-enrolled catalogue cards.
