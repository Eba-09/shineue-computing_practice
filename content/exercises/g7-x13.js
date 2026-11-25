// 7-р анги · Practical task: The compass program (elif)
// Эх сурвалж: Learner's Book 8, Topic 1.4 — Programming task 1.12; Unplugged activity (team scores); Example 2 (stars).
const COMPASS =
  'degrees = int(input("Enter the number of degrees you are facing"))\n' +
  'if degrees >= 315:\n    print("North")\n' +
  'elif degrees >= 225:\n    print("West")\n' +
  'elif degrees >= 135:\n    print("South")\n' +
  'elif degrees >= 45:\n    print("East")\n' +
  'else:\n    print("North")';

const set = {
  lessonId: 'g7-x13',
  intro: 'elif-ийн нөхцлүүд дээрээс доош дарааллаараа шалгагдана. Эхний үнэн нөхцөл л ажиллана.',
  exercises: [
    {
      id: 'e1',
      type: 'output',
      label: 'PREDICT THE OUTPUT',
      title: 'Компас · 45°',
      prompt: '45 гэж оруулав. Програм юу хэвлэхийг бич.',
      code: COMPASS,
      accept: ['East'],
      hint: 'Нөхцлүүдийг дээрээс нь нэг нэгээр шалга. 45 >= 45 үнэн үү?',
      solution: 'East — эхний гурван нөхцөл худал, degrees >= 45 үнэн.',
      source: 'Programming task 1.12',
      seconds: 120,
    },
    {
      id: 'e2',
      type: 'mcq',
      label: 'PREDICT THE OUTPUT',
      title: 'Компас · 300°',
      prompt: 'Дээрх програмд 300 гэж оруулбал юу хэвлэх вэ?',
      code: COMPASS,
      options: ['North', 'West', 'South', 'East'],
      answer: 1,
      hint: '300 >= 315 худал. Дараагийн нөхцөл юу вэ?',
      solution: 'West — 300 >= 225 үнэн тул энэ салаа ажиллана.',
      seconds: 90,
    },
    {
      id: 'e3',
      type: 'order',
      label: 'PUT IN ORDER',
      title: 'Хожсон баг',
      prompt: 'Хоёр багийн нэр, оноог оруулсны дараа хожсон багийг эсвэл тэнцсэнийг хэвлэ. Доорх мөрүүдийг чирж зөв дараалалд оруул.',
      before:
        'team1Name = input("Enter the name of team 1")\nteam2Name = input("Enter the name of team 2")\nteam1Score = int(input("Enter team 1\'s score"))\nteam2Score = int(input("Enter team 2\'s score"))',
      lines: [
        'if team1Score == team2Score:',
        '    print("It\'s a draw")',
        'elif team1Score > team2Score:',
        '    print(team1Name, "wins")',
        'elif team2Score > team1Score:',
        '    print(team2Name, "wins")',
      ],
      orders: [
        [0, 1, 2, 3, 4, 5],
        [0, 1, 4, 5, 2, 3],
      ],
      hint: 'if үргэлж эхэнд байна. Нөхцөл бүрийн доор түүний print мөр шууд орно.',
      solution: 'if team1Score == team2Score:\n    print("It\'s a draw")\nelif team1Score > team2Score:\n    print(team1Name, "wins")\nelif team2Score > team1Score:\n    print(team2Name, "wins")',
      source: 'Learner\'s Book 8, Topic 1.4, Unplugged activity',
      seconds: 180,
    },
    {
      id: 'e4',
      type: 'fill',
      label: 'COMPLETE THE CODE',
      title: 'Цагийн минут',
      prompt: 'Минутыг (0–59) оруулж, хамгийн ойрын мөчийг хэвлэ: "On the hour", "Quarter past", "Half past" эсвэл "Quarter to". Хоосон нүдийг нөх.',
      code: 'minutes = int(input("Enter the minutes past the hour"))\nif minutes <= 7:\n    print("On the hour")\nelif minutes <= 22:\n    print("Quarter past")\nelif minutes <= ___:\n    print("Half past")\nelif minutes <= 52:\n    print("Quarter to")\nelse:\n    print("On the hour")',
      table: [['25', 'Half past'], ['37', 'Half past'], ['38', 'Quarter to'], ['58', 'On the hour']],
      accept: [['37']],
      hint: 'Half past = 30 минут. Quarter to = 45 минут. Хоёрын яг дундах хил хаана вэ? Бусад хилүүдтэй харьцуул: 7, 22, ..., 52.',
      solution: 'elif minutes <= 37:',
      source: 'Programming task 1.12, Make',
      seconds: 180,
    },
  ],
  bonus: [
    {
      id: 'b1',
      type: 'fix',
      label: 'CHALLENGE',
      title: 'Од буруу гарч байна',
      prompt: '85 оруулахад "Gold star" гарах ёстой атал "Bronze star" гарч байна. Нөхцлүүдийн дарааллыг засаж, програмыг зөв болго.',
      code: 'score = int(input("Enter your percentage"))\nif score >= 50:\n    print("Bronze star")\nelif score >= 60:\n    print("Silver star")\nelif score >= 80:\n    print("Gold star")\nelse:\n    print("You needed 50% to pass")',
      table: [['85', 'Gold star'], ['65', 'Silver star'], ['50', 'Bronze star'], ['30', 'You needed 50% to pass']],
      accept: [
        'score = int(input("Enter your percentage"))\nif score >= 80:\n    print("Gold star")\nelif score >= 60:\n    print("Silver star")\nelif score >= 50:\n    print("Bronze star")\nelse:\n    print("You needed 50% to pass")',
      ],
      hint: '85 >= 50 үнэн тул эхний салаа ажиллаад бусдыг нь шалгахгүй. Аль нөхцлийг хамгийн түрүүнд шалгах ёстой вэ?',
      solution: 'if score >= 80 → elif score >= 60 → elif score >= 50 → else',
      source: 'Learner\'s Book 8, Topic 1.4, Example 2',
      seconds: 240,
    },
  ],
};
export default set;
