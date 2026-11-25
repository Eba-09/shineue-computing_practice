// 7-р анги · Practical task: Moving a character (elif)
// Эх сурвалж: Learner's Book 8, Topic 1.4 — Programming task 1.13; Common errors table.
const GAME =
  'horizontal = 10\nvertical = 20\n' +
  'direction = input("Enter U, D, L or R")\n' +
  'if direction == "U":\n    vertical = vertical + 1\n' +
  'elif direction == "D":\n    vertical = vertical - 1\n' +
  'elif direction == "R":\n    horizontal = horizontal + 1\n' +
  'elif direction == "L":\n    horizontal = horizontal - 1\n' +
  'else:\n    print("Invalid movement")\n' +
  'print("Your horizontal position is", horizontal)\n' +
  'print("Your vertical position is", vertical)';

const set = {
  lessonId: 'g7-x14',
  intro: 'Салаа бүр хувьсагчийн утгыг өөрчилнө. Хэвлэх мөрүүд if-ийн гадна тул үргэлж ажиллана.',
  exercises: [
    {
      id: 'e1',
      type: 'output',
      label: 'PREDICT THE OUTPUT',
      title: 'Дээш алхах',
      prompt: 'U гэж оруулав. Програм хэвлэх хоёр мөрийг бич.',
      code: GAME,
      accept: ['Your horizontal position is 10 Your vertical position is 21'],
      hint: 'U оруулахад зөвхөн vertical өөрчлөгдөнө. Хоёр print мөр хоёулаа ажиллана.',
      solution: 'Your horizontal position is 10\nYour vertical position is 21',
      source: 'Programming task 1.13',
      seconds: 150,
    },
    {
      id: 'e2',
      type: 'mcq',
      label: 'PREDICT THE OUTPUT',
      title: 'Жижиг үсэг',
      prompt: 'Дээрх програмд жижиг u гэж оруулбал юу болох вэ?',
      code: GAME,
      options: [
        'vertical 21 болж, хоёр мөр хэвлэнэ',
        '"Invalid movement", дараа нь 10 ба 20 гэсэн байрлал хэвлэнэ',
        'Програм алдаа заагаад зогсоно',
        'Юу ч хэвлэхгүй',
      ],
      answer: 1,
      hint: '"u" == "U" үнэн үү? Python том, жижиг үсгийг ялгадаг.',
      solution: '"Invalid movement" — "u" нь "U"-тай тэнцүү биш тул else ажиллана. Байрлал өөрчлөгдөхгүй.',
      seconds: 90,
    },
    {
      id: 'e3',
      type: 'fill',
      label: 'MODIFY',
      title: 'Хурдан алхам',
      prompt: 'Дээш алхахад vertical 10-аар нэмэгддэг болсон. Доош алхахад 10-аар, зүүн тийш алхахад 1-ээр буурдаг болгож хоосон нүднүүдийг нөх.',
      code: 'if direction == "U":\n    vertical = vertical + 10\nelif direction == "D":\n    vertical = ___\nelif direction == "R":\n    horizontal = horizontal + 1\nelif direction == "L":\n    horizontal = ___',
      table: [['D', 'vertical: 20 → 10'], ['L', 'horizontal: 10 → 9']],
      accept: [['vertical-10'], ['horizontal-1']],
      hint: 'Хуучин утгаас хасна: хувьсагч = хувьсагч - тоо.',
      solution: 'vertical = vertical - 10\nhorizontal = horizontal - 1',
      source: 'Programming task 1.13, Modify',
      seconds: 150,
    },
    {
      id: 'e4',
      type: 'fix',
      label: 'FIX THE ERRORS',
      title: 'Гурван бичлэгийн алдаа',
      prompt: 'Програмд гурван бичлэгийн алдаа (syntax error) байна. Бүгдийг нь зас.',
      code: 'direction = input("Enter U or D")\nif direction = "U":\n    print("Up")\nelse if direction == "D":\n    print("Down")\nelse\n    print("Invalid movement")',
      table: [['U', 'Up'], ['D', 'Down'], ['X', 'Invalid movement']],
      accept: [
        'direction = input("Enter U or D")\nif direction == "U":\n    print("Up")\nelif direction == "D":\n    print("Down")\nelse:\n    print("Invalid movement")',
      ],
      hint: 'Харьцуулах тэмдэг, ELSEIF-ийн Python дахь бичлэг, else-ийн ард юу байх ёстойг шалга.',
      solution: 'if direction == "U":\nelif direction == "D":\nelse:',
      source: 'Learner\'s Book 8, Topic 1.4, Common errors',
      seconds: 240,
    },
  ],
  bonus: [
    {
      id: 'b1',
      type: 'fill',
      label: 'CHALLENGE',
      title: 'Талбайн зах',
      prompt: 'Тоглогчийн талбай horizontal 0-ээс 1000 хүртэл. Ирмэгээс 10 ба түүнээс бага зайтай бол аль ирмэгт ойр байгааг хэвлэ. Хоосон нүдийг нөх.',
      code: 'horizontal = int(input("Enter the horizontal position"))\nif horizontal <= 10:\n    print("Near the left edge")\nelif horizontal >= ___:\n    print("Near the right edge")',
      table: [['9', 'Near the left edge'], ['990', 'Near the right edge'], ['500', '—']],
      accept: [['990']],
      hint: '1000-аас 10 алхамын дотор байх хамгийн бага тоо хэд вэ?',
      solution: 'elif horizontal >= 990:',
      source: 'Programming task 1.13, Make',
      seconds: 150,
    },
  ],
};
export default set;
