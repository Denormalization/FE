'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Book from '@/components/book';
import { KNOWLEDGE_GRAPH_DATA } from '@/mock/graph';
import { GraphNode, GraphLink } from '@/types/graph';

export default function BookDB() {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!svgRef.current) return;

        const width = 1200;
        const height = 800;

        const svg = d3.select(svgRef.current)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('width', '100%')
            .attr('height', '100%')
            .style('cursor', 'grab');

        svg.selectAll('*').remove();

        const g = svg.append('g');

        svg.call(
            d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.5, 5])
                .on('zoom', e => g.attr('transform', e.transform))
        );

        const simulation = d3.forceSimulation<GraphNode>(KNOWLEDGE_GRAPH_DATA.nodes)
            .force('link', d3.forceLink<GraphNode, GraphLink>(KNOWLEDGE_GRAPH_DATA.links)
                .id(d => d.id)
                .distance(d => ((d.source as GraphNode).type === 'main' ? 300 : 150)))
            .force('charge', d3.forceManyBody().strength(-1200))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide<GraphNode>().radius(d => d.radius + 30));

        const link = g.append('g')
            .attr('stroke', '#E5E7EB')
            .attr('stroke-opacity', 0.8)
            .selectAll('line')
            .data(KNOWLEDGE_GRAPH_DATA.links)
            .join('line')
            .attr('stroke-width', 2);

        const node = g.append('g')
            .selectAll('g')
            .data(KNOWLEDGE_GRAPH_DATA.nodes)
            .join('g')
            .call(
                d3.drag<SVGGElement, GraphNode>()
                    .on('start', e => {
                        if (!e.active) simulation.alphaTarget(0.3).restart();
                        e.subject.fx = e.subject.x;
                        e.subject.fy = e.subject.y;
                        svg.style('cursor', 'grabbing');
                    })
                    .on('drag', e => {
                        e.subject.fx = e.x;
                        e.subject.fy = e.y;
                    })
                    .on('end', e => {
                        if (!e.active) simulation.alphaTarget(0);
                        if (e.subject.type !== 'main') {
                            e.subject.fx = null;
                            e.subject.fy = null;
                        }
                        svg.style('cursor', 'grab');
                    }) as any
            );

        node.append('circle')
            .attr('r', d => d.radius)
            .attr('fill', d => d.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 3)
            .attr('class', 'cursor-pointer transition-all duration-300 hover:scale-110')
            .on('mouseover', (e, d) => {
                setHoveredNode(d);
                setTooltipPos({ x: e.clientX, y: e.clientY });
            })
            .on('mousemove', e => {
                setTooltipPos({ x: e.clientX, y: e.clientY });
            })
            .on('mouseout', () => {
                setHoveredNode(null);
            });

        node.append('text')
            .text(d => d.label)
            .attr('dy', d => (d.type === 'main' ? '0.35em' : d.radius + 20))
            .attr('text-anchor', 'middle')
            .attr('fill', d => (d.type === 'main' ? '#fff' : '#4B5563'))
            .attr('font-size', d => (d.type === 'main' ? '1.5rem' : '0.875rem'))
            .attr('font-weight', '700')
            .attr('pointer-events', 'none');

        simulation.on('tick', () => {
            link
                .attr('x1', d => (d.source as any).x)
                .attr('y1', d => (d.source as any).y)
                .attr('x2', d => (d.target as any).x)
                .attr('y2', d => (d.target as any).y);

            node.attr('transform', d => `translate(${(d as any).x}, ${(d as any).y})`);
        });

        const mainNodes = KNOWLEDGE_GRAPH_DATA.nodes.filter(n => n.type === 'main');
        const mainNodeRadius = 150;

        mainNodes.forEach((node, index) => {
            const angle = (index / mainNodes.length) * 2 * Math.PI;
            node.fx = width / 2 + mainNodeRadius * Math.cos(angle);
            node.fy = height / 2 + mainNodeRadius * Math.sin(angle);
        });

        return () => { simulation.stop(); };
    }, []);

    return (
        <div className="relative w-full h-full">
            <Book
                leftContent={
                    <div className="relative h-full w-full bg-[#FAFAFA]/50 overflow-visible">
                        <svg ref={svgRef} className="w-full h-full" />
                    </div>
                }
                rightContent={
                    <div className="flex flex-col items-center justify-center h-full px-12 text-center">
                        <h2 className="text-4xl font-extrabold text-gray-800 mb-6 tracking-tight">
                            나만의<br />지식창고
                        </h2>
                        <div className="w-12 h-1 bg-[#38844E] mb-8 rounded-full" />
                        <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                            지식의 조각들이 연결된 그래프 뷰입니다.<br />
                            단어에 마우스를 올리면 의미를 확인할 수 있어요.<br />
                            화면을 확대하면 더 자세히 볼 수 있어요.
                        </p>
                    </div>
                }
            />

            {hoveredNode && (
                <div
                    className="fixed pointer-events-none z-[9999]"
                    style={{
                        left: tooltipPos.x + 24,
                        top: tooltipPos.y - 140
                    }}
                >
                    <div className="bg-white backdrop-blur-md px-6 py-8 rounded-[16px] shadow-[0_2.5rem_5rem_rgba(0,0,0,0.1)] w-[26rem]">
                        <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">
                            {hoveredNode.label}
                        </h3>
                        <p className="text-1.5xl text-gray-700 leading-[1.6] text-justify font-serif">
                            {hoveredNode.description}
                        </p>

                        {hoveredNode.quote && (
                            <div className="flex flex-col items-center mt-2">
                                <div className="text-5xl text-gray-200 font-serif mb-0 leading-none select-none">“</div>

                                <p className="text-1.5xl text-gray-400 text-center leading-relaxed mb-4 font-serif whitespace-pre-wrap">
                                    {hoveredNode.quote}
                                </p>

                                <div className="text-[0.9rem] text-gray-400 font-serif tracking-tight">
                                    「{hoveredNode.label}」 {hoveredNode.author}
                                </div>

                                <div className="text-4xl text-gray-200 font-serif leading-none select-none transform rotate-180">“</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}