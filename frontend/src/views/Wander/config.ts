export interface ReviewData {
  id: number
  username: string
  avatar: string
  timeAgo: string
  movieName: string
  movieImage: string
  rating: number
  reviewText: string
}

export const reviewMockData: ReviewData[] = [
  {
    id: 1,
    username: '用户名1',
    avatar: 'https://github.com/shadcn.png',
    timeAgo: '2h ago',
    movieName: '电影名1',
    movieImage: 'https://picsum.photos/200/300?random=1',
    rating: 3,
    reviewText: '"Absolutely bonkers! The art style in the second act changed my life. It felt like watching a comic book come to life but with even more punch! 10/10 would watch again tomorrow."'
  },
  {
    id: 2,
    username: '用户名2',
    avatar: 'https://github.com/shadcn.png',
    timeAgo: '4h ago',
    movieName: '电影名2',
    movieImage: 'https://picsum.photos/200/300?random=2',
    rating: 5,
    reviewText: '"A masterpiece! Every frame is carefully crafted. The director\'s vision is crystal clear and perfectly executed throughout the entire film."'
  },
  {
    id: 3,
    username: '用户名3',
    avatar: 'https://github.com/shadcn.png',
    timeAgo: '6h ago',
    movieName: '电影名3',
    movieImage: 'https://picsum.photos/200/300?random=3',
    rating: 4,
    reviewText: '"Amazing storytelling with incredible cinematography. The dialogue is witty and the pacing keeps you engaged from start to finish."'
  },
  {
    id: 4,
    username: '用户名4',
    avatar: 'https://github.com/shadcn.png',
    timeAgo: '8h ago',
    movieName: '电影名4',
    movieImage: 'https://picsum.photos/200/300?random=4',
    rating: 5,
    reviewText: '"A visual spectacle! The special effects are jaw-dropping and the soundtrack perfectly complements the emotional depth of the story."'
  },
  {
    id: 5,
    username: '用户名5',
    avatar: 'https://github.com/shadcn.png',
    timeAgo: '10h ago',
    movieName: '电影名5',
    movieImage: 'https://picsum.photos/200/300?random=5',
    rating: 4,
    reviewText: '"Great film with memorable characters. The actor\'s performances are outstanding and the plot twists keep you on your toes."'
  }
]
