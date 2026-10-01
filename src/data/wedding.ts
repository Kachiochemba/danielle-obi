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
    {
      icon: "map",
      label: "CEREMONY",
      title: "The Cathedral Church of Christ",
      note: "29 Marina Road, Lagos Island, Lagos",
    },
    {
      icon: "calendar",
      label: "DATE",
      title: "Saturday, 14 November 2026",
      note: "Please save the date",
    },
    { icon: "clock", label: "ARRIVAL", title: "11:00 AM", note: "Ceremony begins at 12:00 PM" },
    {
      icon: "party",
      label: "RECEPTION",
      title: "Bics Boat Club (Bics Garden)",
      note: "Wole Olateju Crescent, Lekki Phase 1, Lekki, Lagos",
    },
    {
      icon: "shirt",
      label: "DRESS CODE",
      title: "Strictly Black Tie",
      note: "Formal evening attire",
    },
    {
      icon: "diamond",
      label: "OUR MOTTO",
      title: "Two Hearts, One Throne",
      note: "Danielle & Obi",
    },
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
    {
      title: "Where Two Souls First Crossed",
      image: "story-1.jpg",
      text: "Our story began in a place filled with ambition, academic pressure, late-night readings and endless lectures. Neither of us expected to find our forever person, but fate had other ideas.",
    },
    {
      title: "When Something Felt Different",
      image: "story-2.jpg",
      text: "What started off as stolen glances became intense butterflies and anticipation, which eventually led to a fated breakdown of a car on a sunny afternoon, where the spark was finally ignited.",
    },
    {
      title: "The Day Fate Found a Way",
      image: "story-3.jpg",
      text: "Sometimes, we can’t help but wonder if our love would ever have blossomed if that car had never broken down that day. But the truth is, a love like this is destined for the ages. In any other life, time or multiverse, we would have found our way to each other.",
    },
    {
      title: "Written in the Stars",
      image: "story-4.jpg",
      text: "But in this lifetime, all it took was a broken-down car, a brave hello, and two people who had no idea they had just met their forever.",
    },
  ],
  storyClosing: "And so, our story began….",
  gallery: [
    { file: "gallery-1.jpg", alt: "Danielle and Obi in red and gold traditional attire" },
    { file: "gallery-2.jpg", alt: "Danielle smiling through Obi's hands" },
    { file: "gallery-3.jpg", alt: "Danielle and Obi holding hands in traditional attire" },
    {
      file: "gallery-4.jpg",
      alt: "Danielle and Obi in elegant black attire beside a wooden bench",
    },
    { file: "gallery-5.jpg", alt: "Danielle and Obi smiling together in elegant black attire" },
    { file: "gallery-7.jpg", alt: "Danielle and Obi standing arm in arm in elegant black attire" },
  ],
  gifts: [
    { icon: "bank", title: "A Little Blessing", text: "A little something for our next chapter." },
    { icon: "gift", title: "Gift Registry", text: "Choose something special for our new home." },
    {
      icon: "heart",
      title: "Your Good Wishes",
      text: "Leave a prayer, a wish, or a few words of love.",
    },
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
