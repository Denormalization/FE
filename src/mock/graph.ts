import * as d3 from 'd3';

export interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    description: string;
    quote?: string;
    author?: string;
    radius: number;
    color: string;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    source: string | GraphNode;
    target: string | GraphNode;
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

const COLORS = ['#38844E', '#409659', '#4E7A5D', '#6B9078', '#2D5A3C', '#558B6E', '#437356'];
const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export const KNOWLEDGE_GRAPH_DATA: GraphData = {
    nodes: [
        {
            id: 'center',
            label: '복숭아',
            description: '불로장생, 신선, 귀신을 쫓는 힘, 자손 번창 등 다층적 의미를 지니며, 아름다운 여성과 이상향을 상징하기도 합니다.',
            quote: '아니 도대체 할 일이 왜 이렇게 많은거야 에휴 복숭아 익는척하지마',
            author: '류승잔',
            radius: 40,
            color: '#38844E'
        },
        {
            id: 'n1',
            label: '불로장생',
            description: '죽지 않고 오래도록 살아감. 고대 신화와 설화에서 복숭아는 영생의 과일로 묘사됩니다.',
            radius: 12,
            color: getRandomColor()
        },
        {
            id: 'n2',
            label: '신선',
            description: '세속을 떠나 신비한 도술을 부리는 사람. 서왕모의 곤륜산 반도원이 대표적 예시입니다.',
            radius: 14,
            color: getRandomColor()
        },
        {
            id: 'n3',
            label: '귀신 차단',
            description: '복숭아 나무의 가지나 열매가 사악한 기운과 귀신을 물리치는 힘이 있다고 믿어왔습니다.',
            radius: 10,
            color: getRandomColor()
        },
        {
            id: 'n4',
            label: '자손 번창',
            description: '많은 씨앗과 풍성한 결실은 다산과 가문의 번영을 상징합니다.',
            radius: 12,
            color: getRandomColor()
        },
        {
            id: 'n5',
            label: '다층적 의미',
            description: '복숭아는 단순한 과일을 넘어 종교, 문학, 예술에서 다양한 상징으로 해석됩니다.',
            radius: 15,
            color: getRandomColor()
        },
        {
            id: 'n6',
            label: '아름다운 여성',
            description: '붉고 부드러운 복숭아의 빛깔과 형태는 미인의 생기 넘치는 얼굴을 비유합니다.',
            radius: 13,
            color: getRandomColor()
        },
        {
            id: 'n7',
            label: '이상향',
            description: '무릉도원과 같이 현실에 존재하지 않는 평화롭고 아름다운 세계를 상징합니다.',
            radius: 14,
            color: getRandomColor()
        },
        {
            id: 'n8',
            label: '도화지',
            description: '복숭아 꽃이 핀 땅이라는 뜻으로, 문학적 상상력의 원천이 되는 장소를 의미합니다.',
            radius: 11,
            color: getRandomColor()
        }
    ],
    links: [
        { source: 'center', target: 'n1' },
        { source: 'center', target: 'n2' },
        { source: 'center', target: 'n3' },
        { source: 'center', target: 'n4' },
        { source: 'center', target: 'n5' },
        { source: 'center', target: 'n6' },
        { source: 'center', target: 'n7' },
        { source: 'center', target: 'n8' }
    ]
};
