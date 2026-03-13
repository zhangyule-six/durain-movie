export interface FilmDetailBase {
  /** 用于路由参数的唯一标识 */
  name: string
  /** 展示用标题 */
  displayName: string
  poster: string
  rating: number
  ratingCount: number
  year: number
  duration: string
  region: string
  genres: string[]
  summary: string
}

export interface CastMember {
  id: number
  name: string
  role: string
  avatar: string
}

export interface ReviewBuzz {
  id: number
  nickname: string
  avatar: string
  score: number
  quote: string
}

export interface Recommendation {
  name: string
  displayName: string
  poster: string
  subtitle: string
}

export interface FilmDetailFull {
  base: FilmDetailBase
  cast: CastMember[]
  buzz: ReviewBuzz[]
  recommendations: Recommendation[]
}

const dunePoster =
  'https://images.pexels.com/photos/799137/pexels-photo-799137.jpeg?auto=compress&cs=tinysrgb&w=600'

const interstellarPoster =
  'https://images.pexels.com/photos/2150/sky-space-dark-galaxy.jpg?auto=compress&cs=tinysrgb&w=600'

const creatorPoster =
  'https://images.pexels.com/photos/799146/pexels-photo-799146.jpeg?auto=compress&cs=tinysrgb&w=600'

export const filmDetailMap: Record<string, FilmDetailFull> = {
  dune: {
    base: {
      name: 'dune',
      displayName: 'DUNE: PART TWO',
      poster: dunePoster,
      rating: 8.9,
      ratingCount: 1240,
      year: 2024,
      duration: '166 分钟',
      region: '美国',
      genres: ['史诗动作', '科幻冒险'],
      summary:
        '保罗·厄崔迪与弗雷曼人并肩作战，在偏远沙漠星球上掀起复仇风暴。他一边直面摧毁家族的阴谋，一边在“天选之子”与“普通人”之间做出抉择。'
    },
    cast: [
      {
        id: 1,
        name: 'Timothée Chalamet',
        role: 'Paul Atreides',
        avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200'
      },
      {
        id: 2,
        name: 'Zendaya',
        role: 'Chani',
        avatar: 'https://images.pexels.com/photos/1130624/pexels-photo-1130624.jpeg?auto=compress&cs=tinysrgb&w=200'
      },
      {
        id: 3,
        name: 'Denis Villeneuve',
        role: 'Director',
        avatar: 'https://images.pexels.com/photos/2745954/pexels-photo-2745954.jpeg?auto=compress&cs=tinysrgb&w=200'
      }
    ],
    buzz: [
      {
        id: 1,
        nickname: 'MARCUX',
        avatar: 'https://github.com/shadcn.png',
        score: 9.2,
        quote: '沙丘宇宙从未如此立体，IMAX 必刷。'
      },
      {
        id: 2,
        nickname: '沙漠拾光',
        avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
        score: 8.8,
        quote: '声音设计和配乐直接把你推到沙暴中心。'
      }
    ],
    recommendations: [
      {
        name: 'interstellar',
        displayName: 'INTERSTELLAR',
        poster: interstellarPoster,
        subtitle: '宇宙 · 亲情'
      },
      {
        name: 'creator',
        displayName: 'THE CREATOR',
        poster: creatorPoster,
        subtitle: 'AI · 反乌托邦'
      }
    ]
  },
  interstellar: {
    base: {
      name: 'interstellar',
      displayName: 'INTERSTELLAR',
      poster: interstellarPoster,
      rating: 9.3,
      ratingCount: 1890345,
      year: 2014,
      duration: '169 分钟',
      region: '美国 / 英国',
      genres: ['科幻', '家庭', '冒险'],
      summary:
        '地球资源即将耗尽，前 NASA 飞行员库珀被迫踏上穿越虫洞的旅程，去寻找人类新的家园，也在时间洪流中寻找与女儿的重逢。'
    },
    cast: [
      {
        id: 1,
        name: 'Matthew McConaughey',
        role: 'Cooper',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200'
      },
      {
        id: 2,
        name: 'Anne Hathaway',
        role: 'Brand',
        avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200'
      }
    ],
    buzz: [
      {
        id: 1,
        nickname: '量子纠缠',
        avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
        score: 9.5,
        quote: '看完开始怀疑时间的线性。'
      }
    ],
    recommendations: [
      {
        name: 'dune',
        displayName: 'DUNE: PART TWO',
        poster: dunePoster,
        subtitle: '史诗级科幻续章'
      }
    ]
  },
  creator: {
    base: {
      name: 'creator',
      displayName: 'THE CREATOR',
      poster: creatorPoster,
      rating: 7.8,
      ratingCount: 32045,
      year: 2023,
      duration: '133 分钟',
      region: '美国',
      genres: ['科幻', '动作'],
      summary:
        '在人与 AI 的战争逼近终极阶段时，一名前特种兵被迫寻找“创造者”——可能终结一切的神秘武器。'
    },
    cast: [],
    buzz: [],
    recommendations: [
      {
        name: 'dune',
        displayName: 'DUNE: PART TWO',
        poster: dunePoster,
        subtitle: '沙丘宇宙史诗回归'
      }
    ]
  }
}

export function getFilmDetailByName(name: string): FilmDetailFull | undefined {
  return filmDetailMap[name]
}

