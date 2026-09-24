export const wedding = {
  couple: { bride: "Danielle", groom: "Obi", initials: "D & O" },
  date: {
    display: "SATURDAY, 14 NOVEMBER 2026 · 12:00 PM",
    long: "Saturday, 14 November 2026",
    start: "20261114T110000Z",
    end: "20261114T160000Z",
  },
  gate: {
    closedEyebrow: "YOU'VE GOT MAIL FROM",
    openEyebrow: "WE'RE GETTING MARRIED!",
    caption: "TAP ENVELOPE TO OPEN",
    monogram: "D & O",
    saveLine: "Save our",
    saveWord: "Date",
    medallion: ["14.11.2026", "LAGOS", "NIGERIA"],
    footnote: "Two Hearts, One Throne",
  },
  invitation: {
    eyebrow: "TOGETHER WITH OUR FAMILIES",
    welcome: "We do!",
    subtitle: "Two Hearts, One Throne",
    body: "You are warmly invited to celebrate our wedding",
  },
  venue: {
    name: "The Cathedral Church of Christ",
    short: "29 Marina Road, Lagos Island, Lagos",
    reception: "Bics Boat Club (Bics Garden)",
    receptionAddress: "Wole Olateju Crescent, Lekki Phase 1, Lekki, Lagos",
    mapQuery: "The Cathedral Church of Christ, 29 Marina Road, Lagos Island, Lagos",
  },
  details: [
    { icon: "map", label: "CEREMONY", title: "The Cathedral Church of Christ", note: "29 Marina Road, Lagos Island, Lagos" },
    { icon: "calendar", label: "DATE", title: "Saturday, 14 November 2026", note: "Please save the date" },
    { icon: "clock", label: "ARRIVAL", title: "11:00 AM", note: "Ceremony begins at 12:00 PM" },
    { icon: "party", label: "RECEPTION", title: "Bics Boat Club (Bics Garden)", note: "Wole Olateju Crescent, Lekki Phase 1, Lekki, Lagos" },
    { icon: "shirt", label: "DRESS CODE", title: "Strictly Black Tie", note: "Formal evening attire" },
    { icon: "diamond", label: "OUR MOTTO", title: "Two Hearts, One Throne", note: "Danielle & Obi" },
  ],
  dressCode: {
    subtitle: "An evening of timeless elegance",
    swatches: [
      { name: "Champagne Gold", hex: "#C9B285" },
      { name: "Emerald Green", hex: "#1F6A4C" },
      { name: "Black", hex: "#1A1A1A" },
      { name: "Navy Blue", hex: "#1B2A4A" },
    ],
    note: "We kindly ask our guests to join us in strictly black-tie attire.",
    ladies: "Dinner dresses",
    gentlemen: "Suits",
    closing: "Strictly black tie",
  },
  // image = file name inside the wedding-photos storage. Upload a file with that exact name to replace the placeholder.
  story: [
    { title: "How We Met", image: "story-1.jpg", text: "We first met at a place where neither of us expected to find love. I saw her, and somehow a part of me already knew." },
    { title: "The Chapters in Between", image: "story-2.jpg", text: "What began unexpectedly became a friendship, and that friendship became love, and that love became partnership." },
    { title: "The Question by the Water", image: "story-3.jpg", text: "Perhaps it was fitting that the next chapter of our story happened on water. We had always loved being around it. As the day began to give way to evening, surrounded by water and fading lights, I asked her to take the next step with me, not just for another chapter but for a lifetime." },
    { title: "Still Writing", image: "story-4.jpg", text: "This time the story is no longer about two people wondering where life will take them; it's about two people who have decided to take this journey together. Whatever comes next, we know we want to be beside each other, and this time we get to write the rest of the story together." },
  ],
  gallery: [
    { file: "gallery-1.jpg", alt: "Danielle and Obi in red and gold traditional attire" },
    { file: "gallery-2.jpg", alt: "Danielle smiling through Obi's hands" },
    { file: "gallery-3.jpg", alt: "Danielle and Obi holding hands in traditional attire" },
    { file: "gallery-4.jpg", alt: "Danielle and Obi in elegant black attire beside a wooden bench" },
    { file: "gallery-5.jpg", alt: "Danielle and Obi smiling together in elegant black attire" },
    { file: "gallery-6.jpg", alt: "Danielle and Obi seated together in elegant black attire" },
  ],
  gifts: [
    { icon: "bank", title: "A Little Blessing", text: "Bank transfer details will be shared here by the couple." },
    { icon: "gift", title: "Gift Registry", text: "A registry link can be added here when it is ready." },
    { icon: "heart", title: "Your Good Wishes", text: "A prayer, a warm embrace, and your presence mean everything." },
  ],
} as const;

export const pages = [
  { id: "invitation", label: "Invitation", icon: "ticket" },
  { id: "details", label: "Details", icon: "calendar" },
  { id: "story", label: "Our Story", icon: "heart" },
  { id: "venue", label: "Venue", icon: "map" },
  { id: "rsvp", label: "RSVP", icon: "pen" },
  { id: "gifts", label: "Gifts", icon: "gift" },
] as const;