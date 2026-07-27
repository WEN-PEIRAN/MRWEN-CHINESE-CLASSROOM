window.CHINESE_VOCAB_DATA = {
  years: [
    {
      id: 'year7',
      name: 'Year 7',
      topics: [
        { id: 'greetings', name: 'Greetings', lists: [] },
        { id: 'names', name: 'Introducing Names', lists: [] },
        { id: 'numbers', name: 'Chinese Numbers', lists: [] }
      ]
    },
    {
      id: 'year8',
      name: 'Year 8',
      topics: [
        {
          id: 'family',
          name: 'My Family',
          lists: [
            {
              id: 'family-vocab-1',
              name: 'Vocabulary 1',
              words: [
                ['家人', 'jiā rén', 'family member(s)'],
                ['爸爸', 'bà ba', 'dad'],
                ['妈妈', 'mā ma', 'mum'],
                ['哥哥', 'gē ge', 'older brother'],
                ['弟弟', 'dì di', 'younger brother'],
                ['姐姐', 'jiě jie', 'older sister'],
                ['妹妹', 'mèi mei', 'younger sister'],
                ['儿子', 'ér zi', 'son'],
                ['女儿', 'nǚ ér', 'daughter'],
                ['这是', 'zhè shì', 'this is'],
                ['我的', 'wǒ de', 'my'],
                ['他', 'tā', 'he'],
                ['她', 'tā', 'she']
              ]
            },
            {
              id: 'family-vocab-2',
              name: 'Vocabulary 2',
              words: [
                ['有', 'yǒu', 'have / has'],
                ['没有', 'méi yǒu', 'do not have / has not'],
                ['几', 'jǐ', 'how many (small number)'],
                ['口', 'kǒu', 'mouth / measure word for family members'],
                ['个', 'gè', 'general measure word'],
                ['人', 'rén', 'person'],
                ['谁', 'shéi / shuí', 'who'],
                ['和', 'hé', 'and'],
                ['兄弟', 'xiōng dì', 'brothers'],
                ['姐妹', 'jiě mèi', 'sisters']
              ]
            }
          ].map(list => ({
            id: list.id,
            name: list.name,
            words: list.words.map(word => ({
              hanzi: word[0],
              pinyin: word[1],
              english: word[2]
            }))
          }))
        },
        {
          id: 'age-grade',
          name: 'Numbers, Age & School Grade',
          lists: [
            {
              id: 'family-vocab-3',
              name: 'Vocabulary 3',
              words: [
                ['零 / 〇', 'líng', 'zero'],
                ['一', 'yī', 'one'],
                ['二', 'èr', 'two'],
                ['三', 'sān', 'three'],
                ['四', 'sì', 'four'],
                ['五', 'wǔ', 'five'],
                ['六', 'liù', 'six'],
                ['七', 'qī', 'seven'],
                ['八', 'bā', 'eight'],
                ['九', 'jiǔ', 'nine'],
                ['十', 'shí', 'ten'],
                ['我', 'wǒ', 'I / me'],
                ['他', 'tā', 'he / him'],
                ['她', 'tā', 'she / her'],
                ['几', 'jǐ', 'how many (small number)'],
                ['几岁', 'jǐ suì', 'how old (child)'],
                ['多大', 'duō dà', 'how old (general)'],
                ['什么名字', 'shén me míng zi', 'what name'],
                ['叫', 'jiào', 'be called'],
                ['岁', 'suì', 'years of age'],
                ['了', 'le', 'sentence-final particle'],
                ['比', 'bǐ', 'compared with'],
                ['大', 'dà', 'older'],
                ['小', 'xiǎo', 'younger'],
                ['年级', 'nián jí', 'year level'],
                ['上', 'shàng', 'attend / be in']
              ]
            }
          ].map(list => ({
            id: list.id,
            name: list.name,
            words: list.words.map(word => ({
              hanzi: word[0],
              pinyin: word[1],
              english: word[2]
            }))
          }))
        }
      ]
    },
    {
      id: 'year9',
      name: 'Year 9',
      topics: [
        { id: 'appearances', name: 'Appearances', lists: [] },
        { id: 'timetable', name: 'School Timetable', lists: [] }
      ]
    },
    {
      id: 'year10',
      name: 'Year 10',
      topics: [
        { id: 'occupations', name: 'Occupations & Transport', lists: [] },
        {
          id: 'my-home',
          name: 'My Home',
          lists: [
            {
              id: 'vocab-1',
              name: 'Vocab List 1',
              words: [
                ['这','zhè','this'],['是','shì','be'],['家','jiā','home'],['有','yǒu','have'],['两','liǎng','two (quantity)'],['间','jiān','measure word for rooms'],['个','gè','general measure word'],['卧室','wò shì','bedroom'],['书房','shū fáng','study'],['客厅','kè tīng','living room'],['餐厅','cān tīng','dining room'],['厨房','chú fáng','kitchen'],['和','hé','and'],['浴室','yù shì','bathroom'],['房间','fáng jiān','room'],['太','tài','too'],['大','dà','big']
              ]
            },
            {
              id: 'vocab-2',
              name: 'Vocab List 2',
              words: [
                ['你们','nǐ men','you (plural)'],['搬家','bān jiā','to move house'],['了','le','completed action particle'],['对','duì','yes; correct'],['我们','wǒ men','we; us'],['上个','shàng gè','last (time)'],['周末','zhōu mò','weekend'],['搬到','bān dào','move to'],['哪儿','nǎr','where'],['进','jìn','enter'],['幢','zhuàng','building measure word'],['楼房','lóu fáng','(high-rise) building'],['那','nà','that'],['一共','yí gòng','in total'],['有','yǒu','to have'],['多少','duō shǎo','how many'],['层','céng','floor/storey/layer'],['新家','xīn jiā','new home'],['在','zài','located at'],['几','jǐ','how many'],['楼','lóu','floor/storey'],['还','hái','also; still'],['喜欢','xǐ huan','to like'],['很','hěn','very']
              ]
            },
            {
              id: 'vocab-3',
              name: 'Vocab List 3',
              words: [
                ['我们','wǒ men','we / us'],['新家','xīn jiā','new home'],['昨天','zuó tiān','yesterday'],['搬进','bān jìn','to move into'],['洋房','yáng fáng','(western-style) house'],['外面','wài miàn','outside'],['花园','huā yuán','garden'],['车库','chē kù','garage'],['游泳池','yóu yǒng chí','swimming pool'],['房子','fáng zi','house'],['前面','qián miàn','in front'],['后面','hòu miàn','behind'],['左边','zuǒ biān','left side'],['右边','yòu biān','right side'],['洗手间','xǐ shǒu jiān','bathroom / toilet'],['客房','kè fáng','guest room'],['时候','shí hou','time; when'],['祝好','zhù hǎo','best wishes']
              ]
            },
            {
              id: 'vocab-4',
              name: 'Vocab List 4',
              words: [
                ['听说','tīng shuō','to hear that'],['喜欢','xǐ huan','to like'],['新','xīn','new'],['叔叔','shū shu','uncle'],['住','zhù','to live'],['楼上','lóu shàng','upstairs'],['爷爷','yé ye','grandfather'],['奶奶','nǎi nai','grandmother'],['楼下','lóu xià','downstairs'],['现在','xiàn zài','now'],['自己','zì jǐ','oneself; own'],['高兴','gāo xìng','happy'],['开心','kāi xīn','happy'],['每天','měi tiān','every day'],['做','zuò','to do'],['作业','zuò yè','homework'],['看书','kàn shū','to read'],['上网','shàng wǎng','to go online'],['挺','tǐng','quite; fairly'],['床','chuáng','bed'],['床头柜','chuáng tóu guì','bedside table'],['书桌','shū zhuō','desk'],['等等','děng děng','etc.'],['左边','zuǒ biān','left side'],['椅子','yǐ zi','chair'],['上面','shàng miàn','on top'],['电脑','diàn nǎo','computer'],['下面','xià miàn','underneath'],['柜子','guì zi','cabinet'],['对面','duì miàn','opposite'],['衣柜','yī guì','wardrobe'],['旁边','páng biān','beside'],['书架','shū jià','bookshelf'],['什么','shén me','what'],['课本','kè běn','textbook'],['小说','xiǎo shuō','novel'],['杂志','zá zhì','magazine'],['相框','xiàng kuàng','photo frame']
              ]
            }
          ].map(list => ({
            id: list.id,
            name: list.name,
            words: list.words.map(word => ({
              hanzi: word[0],
              pinyin: word[1],
              english: word[2]
            }))
          }))
        },
        { id: 'hobbies', name: 'Hobbies', lists: [] }
      ]
    }
  ]
};
