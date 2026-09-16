/*
=========================================================
Chinese Radicals List
=========================================================

Structure:

{
    level: 1,
    character: "一",
    meaning: "one / horizontal",
    idea: "A single horizontal stroke.",
    example: "天",
    exampleMeaning: "sky / heaven"
}

Current version:
Level 1 → 10 radicals
Level 2 → 10 radicals
Level 3 → 10 radicals

Total → 30 radicals

=========================================================
*/


const RadicalsList = [

    /* =====================================================
       LEVEL 1 — ESSENTIAL RADICALS
    ===================================================== */

    {
        level: 1,
        character: "一",
        meaning: "one / horizontal",
        idea: "A single horizontal stroke representing one or a horizontal line.",
        example: "一",
        exampleMeaning: "one"
    },

    {
        level: 1,
        character: "丨",
        meaning: "vertical stroke",
        idea: "A simple vertical line used as a fundamental character element.",
        example: "中",
        exampleMeaning: "middle / center"
    },

    {
        level: 1,
        character: "丶",
        meaning: "dot",
        idea: "A small dot-shaped stroke that appears in many Chinese characters.",
        example: "主",
        exampleMeaning: "main / master"
    },

    {
        level: 1,
        character: "丿",
        meaning: "slash",
        idea: "A diagonal stroke falling from upper right toward lower left.",
        example: "千",
        exampleMeaning: "thousand"
    },

    {
        level: 1,
        character: "乙",
        meaning: "second / bent stroke",
        idea: "A bent stroke associated with the second position and curved forms.",
        example: "乙",
        exampleMeaning: "second"
    },

    {
        level: 1,
        character: "二",
        meaning: "two",
        idea: "Two horizontal strokes representing the number two.",
        example: "二",
        exampleMeaning: "two"
    },

    {
        level: 1,
        character: "亠",
        meaning: "lid / top",
        idea: "A small top element that often appears like a cover or lid.",
        example: "京",
        exampleMeaning: "capital city"
    },

    {
        level: 1,
        character: "人 / 亻",
        meaning: "person",
        idea: "Represents a person. The 亻 form commonly appears on the left side of characters.",
        example: "你",
        exampleMeaning: "you"
    },

    {
        level: 1,
        character: "入",
        meaning: "enter",
        idea: "Represents entering or going inward; its shape suggests movement into a space.",
        example: "入口",
        exampleMeaning: "entrance"
    },

    {
        level: 1,
        character: "八",
        meaning: "eight / divide",
        idea: "The shape spreads apart and is associated with dividing or separating.",
        example: "八",
        exampleMeaning: "eight"
    },


    /* =====================================================
       LEVEL 2 — IMPORTANT RADICALS
    ===================================================== */

    {
        level: 2,
        character: "口",
        meaning: "mouth",
        idea: "A square shape representing the mouth or an opening.",
        example: "吃",
        exampleMeaning: "to eat"
    },

    {
        level: 2,
        character: "土",
        meaning: "earth / soil",
        idea: "Represents earth, soil, land, or something related to the ground.",
        example: "地",
        exampleMeaning: "ground / earth"
    },

    {
        level: 2,
        character: "女",
        meaning: "woman / female",
        idea: "Represents a woman or female-related concepts.",
        example: "好",
        exampleMeaning: "good"
    },

    {
        level: 2,
        character: "子",
        meaning: "child / son",
        idea: "Represents a child or young person.",
        example: "孩子",
        exampleMeaning: "child"
    },

    {
        level: 2,
        character: "宀",
        meaning: "roof / house",
        idea: "Looks like a roof and commonly appears above characters related to houses or enclosed spaces.",
        example: "家",
        exampleMeaning: "home / family"
    },

    {
        level: 2,
        character: "心 / 忄",
        meaning: "heart / mind",
        idea: "Represents the heart, emotions, thoughts, or the mind. 忄 is its common left-side form.",
        example: "快",
        exampleMeaning: "fast / happy"
    },

    {
        level: 2,
        character: "手 / 扌",
        meaning: "hand",
        idea: "Represents the hand or actions performed with the hand. 扌 commonly appears on the left.",
        example: "打",
        exampleMeaning: "to hit / to play"
    },

    {
        level: 2,
        character: "日",
        meaning: "sun / day",
        idea: "Represents the sun, daylight, or a day.",
        example: "明",
        exampleMeaning: "bright / clear"
    },

    {
        level: 2,
        character: "月",
        meaning: "moon / month / body",
        idea: "Originally represents the moon, but the same form also appears as the body-related 肉 component.",
        example: "明",
        exampleMeaning: "bright / clear"
    },

    {
        level: 2,
        character: "木",
        meaning: "tree / wood",
        idea: "Represents a tree or wood; the shape can be visually remembered as a simple tree.",
        example: "林",
        exampleMeaning: "woods / forest"
    },


    /* =====================================================
       LEVEL 3 — ADVANCED RADICALS
    ===================================================== */

    {
        level: 3,
        character: "辵 / 辶",
        meaning: "walk / movement",
        idea: "Represents walking, movement, or going from one place to another. 辶 is the common modern form.",
        example: "这",
        exampleMeaning: "this"
    },

    {
        level: 3,
        character: "邑 / 阝",
        meaning: "city / place",
        idea: "Associated with cities, settlements, and places. 阝 appears on the right side in this radical form.",
        example: "都",
        exampleMeaning: "all / capital city"
    },

    {
        level: 3,
        character: "金 / 钅",
        meaning: "metal / gold",
        idea: "Represents metal, gold, or metal-related objects. 钅 is the common simplified left-side form.",
        example: "钱",
        exampleMeaning: "money"
    },

    {
        level: 3,
        character: "門 / 门",
        meaning: "gate / door",
        idea: "Looks like a traditional gate or doorway. 门 is the simplified form.",
        example: "问",
        exampleMeaning: "to ask"
    },

    {
        level: 3,
        character: "雨",
        meaning: "rain / weather",
        idea: "Represents rain and weather-related concepts; the dots can be remembered as falling raindrops.",
        example: "雪",
        exampleMeaning: "snow"
    },

    {
        level: 3,
        character: "食 / 飠 / 饣",
        meaning: "food / eating",
        idea: "Represents food, eating, or nourishment. 饣 is the common simplified form.",
        example: "饭",
        exampleMeaning: "rice / meal"
    },

    {
        level: 3,
        character: "馬 / 马",
        meaning: "horse",
        idea: "Represents a horse and appears in many characters associated with horses or as a phonetic component.",
        example: "骑",
        exampleMeaning: "to ride"
    },

    {
        level: 3,
        character: "魚 / 鱼",
        meaning: "fish",
        idea: "Represents a fish and commonly appears in characters related to fish or aquatic life.",
        example: "鲜",
        exampleMeaning: "fresh / delicious"
    },

    {
        level: 3,
        character: "鳥 / 鸟",
        meaning: "bird",
        idea: "Represents a bird and appears in characters associated with birds and flying creatures.",
        example: "鸡",
        exampleMeaning: "chicken"
    },

    {
        level: 3,
        character: "齒 / 齿",
        meaning: "tooth",
        idea: "Represents a tooth. The traditional form visually contains several tooth-like structures.",
        example: "齿",
        exampleMeaning: "tooth"

    }

];


/*
=========================================================
Make the list available globally.

The index.html accesses it as:

window.RadicalsList
=========================================================
*/

window.RadicalsList = RadicalsList;
