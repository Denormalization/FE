'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import * as d3 from 'd3';
import { toast } from 'react-toastify';
import { GraphNode, GraphLink, GraphData } from '@/types/graph';
import { useBook } from '@/context/bookContext';
import { fetchKeywordGraph } from '@/services/library';

export default function BookDB() {
    const simulationRef = useRef<d3.Simulation<GraphNode, undefined> | null>(null);
    const isFirstRender = useRef(true);
    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const { setBookContent, updateBookContent, setOverlayContent } = useBook();

    useEffect(() => {
        fetchKeywordGraph()
            .then(setGraphData)
            .catch((err) => toast.error(err instanceof Error ? err.message : '그래프 로드 실패'));
    }, []);

    const initD3 = useCallback((svgElement: SVGSVGElement) => {
        if (!svgElement || !graphData) return;

        const width = 1200;
        const height = 800;

        const svg = d3.select(svgElement)
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

        if (simulationRef.current) simulationRef.current.stop();

        const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
            .force('link', d3.forceLink<GraphNode, GraphLink>(graphData.links)
                .id(d => d.id)
                .distance(d => ((d.source as GraphNode).type === 'main' ? 300 : 150)))
            .force('charge', d3.forceManyBody().strength(-1200))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide<GraphNode>().radius(d => d.radius + 30));

        simulationRef.current = simulation;

        const link = g.append('g')
            .selectAll('line')
            .data(graphData.links)
            .join('line')
            .attr('stroke', '#E5E7EB')
            .attr('stroke-opacity', 0.8)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', 1000)
            .attr('stroke-dashoffset', 1000)
            .attr('class', 'animate-draw')
            .style('transition', 'stroke 0.3s, stroke-width 0.3s');

        const node = g.append('g')
            .selectAll('g')
            .data(graphData.nodes)
            .join('g')
            .attr('class', 'opacity-0 scale-0')
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

        node.transition()
            .delay((_, i) => 1000 + i * 100)
            .duration(500)
            .attr('class', 'opacity-100 scale-100');

        node.append('circle')
            .attr('r', d => d.radius)
            .attr('fill', d => d.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 3)
            .attr('class', 'cursor-pointer transition-all duration-300 hover:scale-110')
            .on('mouseover', (e, d: GraphNode) => {
                setHoveredNode(d);

                link.attr('stroke', (l: any) =>
                    l.source.id === d.id || l.target.id === d.id ? '#38844E' : '#E5E7EB'
                )
                    .attr('stroke-width', (l: any) =>
                        l.source.id === d.id || l.target.id === d.id ? 3 : 2
                    )
                    .attr('stroke-opacity', (l: any) =>
                        l.source.id === d.id || l.target.id === d.id ? 1 : 0.3
                    );

                node.attr('opacity', (n: any) =>
                    n.id === d.id || graphData.links.some(l =>
                        (l.source as any).id === d.id && (l.target as any).id === n.id ||
                        (l.target as any).id === d.id && (l.source as any).id === n.id
                    ) ? 1 : 0.5
                );
            })
            .on('mousemove', e => {
                const bookElement = document.querySelector('.relative.z-10.flex.w-\\[80rem\\]');
                if (bookElement) {
                    const rect = bookElement.getBoundingClientRect();
                    setTooltipPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                    });
                }
            })
            .on('mouseout', () => {
                setHoveredNode(null);
                setOverlayContent(null);
                link.attr('stroke', '#E5E7EB')
                    .attr('stroke-width', 2)
                    .attr('stroke-opacity', 0.8);
                node.attr('opacity', 1);
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

        const mainNodes = graphData.nodes.filter(n => n.type === 'main');
        const mainNodeRadius = 150;

        mainNodes.forEach((node, index) => {
            const angle = (index / mainNodes.length) * 2 * Math.PI;
            node.fx = width / 2 + mainNodeRadius * Math.cos(angle);
            node.fy = height / 2 + mainNodeRadius * Math.sin(angle);
        });
    }, [graphData, setOverlayContent]);

    useEffect(() => {
        if (hoveredNode) {
            setOverlayContent(
                <div
                    className="absolute pointer-events-none transition-all duration-75 ease-out"
                    style={{
                        left: tooltipPos.x + 20,
                        top: tooltipPos.y + 20,
                    }}
                >
                    <TooltipContent node={hoveredNode} />
                </div>
            );
        }
    }, [hoveredNode, tooltipPos, setOverlayContent]);

    useEffect(() => {
        const leftContent = (
            <div className="relative h-full w-full bg-[#FAFAFA]/50 overflow-visible">
                <svg ref={initD3} className="w-full h-full" />
            </div>
        );

        const rightContent = (
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
        );

        if (isFirstRender.current) {
            setBookContent(leftContent, rightContent);
            isFirstRender.current = false;
        } else {
            updateBookContent(leftContent, rightContent);
        }

        return () => {
            if (simulationRef.current) simulationRef.current.stop();
            setOverlayContent(null);
        };
    }, [
        initD3,
        setBookContent,
        updateBookContent,
        setOverlayContent,
    ]);

    return null;
}

function TooltipContent({ node }: { node: GraphNode }) {
    return (
        <div className="bg-white backdrop-blur-md px-6 py-8 rounded-[16px] shadow-[0_2.5rem_5rem_rgba(0,0,0,0.1)] w-[26rem]">
            <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">
                {node.label}
            </h3>
            <p className="text-1.5xl text-gray-700 leading-[1.6] text-justify font-serif">
                {node.description}
            </p>

            {node.quote && (
                <div className="flex flex-col items-center mt-2">
                    <div className="text-5xl text-gray-200 font-serif mb-0 leading-none select-none">“</div>

                    <p className="text-1.5xl text-gray-400 text-center leading-relaxed mb-4 font-serif whitespace-pre-wrap">
                        {node.quote}
                    </p>

                    <div className="text-[0.9rem] text-gray-400 font-serif tracking-tight">
                        「{node.label}」 {node.author}
                    </div>

                    <div className="text-4xl text-gray-200 font-serif leading-none select-none transform rotate-180">“</div>
                </div>
            )}
        </div>
    );
}