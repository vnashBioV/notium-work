import React, { useEffect, useState } from 'react'

const Motivation = () => {
    const [index, setIndex] = useState(0);

    const quotes = [
        {
            title: "Every Great Idea Starts with Clarity",
            text: "The best ideas don’t appear in chaos; they emerge when your mind is clear. Novaq helps you distil your thoughts into actionable plans, bringing your vision into focus.",
        },
        {
            title: "Small Steps Create Big Change",
            text: "Greatness is built day by day. Novaq helps you take one step at a time toward your dream, turning small wins into momentum.",
        },
        {
            title: "Dream Bold, Plan Smart",
            text: "Big dreams don’t have to be overwhelming. With Novaq, every goal becomes a set of clear, achievable steps you can follow.",
        },
        {
            title: "Focus Is Your Superpower",
            text: "In a noisy world, clarity and focus give you the edge. Novaq keeps distractions away and your vision front and center.",
        },
    ];

    useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 20000); // ⏱️ changes every 20 seconds
    return () => clearInterval(interval);
  }, [quotes.length]);

    return (
        <div className="mt-15 transition-all duration-500">
            {/* Title */}
            <h2 className="font-bold text-lg">"{quotes[index].title}"</h2>

            <div className="h-[185px] w-[457px] p-6 border-l-2 border-[#D9D9D9] mt-2 relative">
            <p>{quotes[index].text}</p>

            {/* bulb icon */}
            <div className='absolute w-[80px] h-[80] right-0 bottom-0'>
                <img src="/ideaBulb.svg" className='object-cover w-full h-full' alt="" />
            </div>
            </div>
        </div>
    )
}

export default Motivation
