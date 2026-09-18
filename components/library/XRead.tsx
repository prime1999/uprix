"use client";

import Link from "next/link";
import { BookText } from "lucide-react";

const books = [
  {
    id: 1,
    links:
      "https://drive.google.com/drive/folders/1UGlMl2SnD89tP3ecxMgQVX671kUVBd22?usp=drive_link",
    title: "January",
    color: "red-600",
  },
  {
    id: 2,
    links:
      "https://drive.google.com/drive/folders/1mGnYiDPWiHuQ6aYDD-_E6dWAbDeGN9KY?usp=drive_link",
    title: "February",
    color: "blue-600",
  },
  {
    id: 3,
    links:
      "https://drive.google.com/drive/folders/1ciDWoPlTOekG0D0XOAOvwIaGT3AYh-pm?usp=drive_link",
    title: "March",
    color: "yellow-600",
  },
  {
    id: 4,
    links:
      "https://drive.google.com/drive/folders/14q_5tLAfTCqmr5M7PQoryPh5WObIPgm_?usp=drive_link",
    title: "April",
    color: "orange-500",
  },
  {
    id: 5,
    links:
      "https://drive.google.com/drive/folders/1DmgIjCwleust0b8NuSsx05UQjGw63nMR?usp=drive_link",
    title: "May",
    color: "green-500",
  },
  {
    id: 6,
    links:
      "https://drive.google.com/drive/folders/17nIbs7gEToXeheoR0UupHJX_E9Yb8k9E?usp=drive_link",
    title: "June",
    color: "purple-500",
  },
  {
    id: 7,
    links:
      "https://drive.google.com/drive/folders/1snxNtdZyN7r_COfvN8A5yxkEdXFhF0uQ?usp=drive_link",
    title: "July",
    color: "pink-600",
  },
  {
    id: 8,
    links:
      "https://drive.google.com/drive/folders/1s3DqFo7qn8N-NQCevlh10xoZLJ25aNh0?usp=drive_link",
    title: "August",
    color: "indigo-500",
  },
  {
    id: 9,
    links:
      "https://drive.google.com/drive/folders/1QTk1gmiuFgp--0SofToh30_VDzAM5iwx?usp=drive_link",
    title: "September",
    color: "cyan-600",
  },
  {
    id: 10,
    links:
      "https://drive.google.com/drive/folders/1qIM9XO46IT_3bESl26bbPBv5P9PwSFfk?usp=drive_link",
    title: "October",
    color: "teal-500",
  },
  {
    id: 11,
    links:
      "https://drive.google.com/drive/folders/1M_aC_OpSirDEAR-00G3nJrFHg9DeprYQ?usp=drive_link",
    title: "November",
    color: "amber-500",
  },
  {
    id: 12,
    links:
      "https://drive.google.com/drive/folders/1BBQ2cNgfVF26n88cFSbrCxmgF0vwUbgg?usp=drive_link",
    title: "December",
    color: "lime-500",
  },
];

const XRead = () => {
  return (
    <main className="w-full max-h-[400px] overflow-y-auto">
      <div className="grid gap-3 grid-cols-2">
        {books.map((book) => (
          <Link
            key={book.id}
            href={book.links}
            target="_blank"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-secondary-blue transition hover:border-secondary-blue hover:shadow-sm"
          >
            <BookText size={16} className={`mb-1 text-${book.color}`} />
            {book.title}
          </Link>
        ))}
      </div>
    </main>
  );
};

export default XRead;
