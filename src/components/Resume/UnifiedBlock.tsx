
import React from 'react';
import type { ResumeNode, LayoutKind, StyleHints } from '../../shared/types';

interface UnifiedBlockProps {
    node: ResumeNode;
    depth: number;
    textDirection: 'ltr' | 'rtl';
    showAddresses?: boolean;
}

/**
 * Unified Block component that renders any node type based on layout property
 */
export const UnifiedBlock: React.FC<UnifiedBlockProps> = ({
    node,
    depth,
    textDirection,
    showAddresses = false
}) => {
    // Determine the layout type (default to container if not specified)
    const effectiveLayout = node.layout || 'container';

    // Build the component based on layout
    switch (effectiveLayout) {
        case 'heading':
            return (
                <HeadingBlock
                    node={node}
                    depth={depth}
                    textDirection={textDirection}
                    showAddresses={showAddresses}
                />
            );

        case 'paragraph':
            return (
                <ParagraphBlock
                    node={node}
                    depth={depth}
                    textDirection={textDirection}
                    showAddresses={showAddresses}
                />
            );

        case 'list-item':
            return (
                <ListItemBlock
                    node={node}
                    depth={depth}
                    textDirection={textDirection}
                    showAddresses={showAddresses}
                />
            );

        case 'key-value':
            return (
                <KeyValueBlock
                    node={node}
                    depth={depth}
                    textDirection={textDirection}
                    showAddresses={showAddresses}
                />
            );

        case 'grid':
            return (
                <GridBlock
                    node={node}
                    depth={depth}
                    textDirection={textDirection}
                    showAddresses={showAddresses}
                />
            );

        case 'container':
        default:
            return (
                <ContainerBlock
                    node={node}
                    depth={depth}
                    textDirection={textDirection}
                    showAddresses={showAddresses}
                />
            );
    }
};

// =============================================================================
// LAYOUT COMPONENTS
// =============================================================================

interface BlockProps {
    node: ResumeNode;
    depth: number;
    textDirection: 'ltr' | 'rtl';
    showAddresses?: boolean;
}

/**
 * Heading component for section headers
 */
const HeadingBlock: React.FC<BlockProps> = ({ node, depth, textDirection, showAddresses }) => {
    const { title, text, style, children, addr } = node;
    const content = title || text || '';
    const level = style?.level || (depth === 0 ? 1 : 2);

    const headingStyle = buildHeadingStyle(style, level, textDirection);

    return (
        <div style={{ position: 'relative' }}>
            {showAddresses && addr && <AddressBadge address={addr} />}
            <div style={headingStyle}>
                {content}
            </div>
            {children && children.length > 0 && (
                <div style={buildChildrenContainerStyle('container', depth, textDirection)}>
                    {children.map((child) => (
                        <UnifiedBlock
                            key={child.uid}
                            node={child}
                            depth={depth + 1}
                            textDirection={textDirection}
                            showAddresses={showAddresses}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * Paragraph component for text blocks
 */
const ParagraphBlock: React.FC<BlockProps> = ({ node, depth, textDirection, showAddresses }) => {
    const { title, text, style, children, addr } = node;
    const content = title || text || '';

    const paragraphStyle = buildParagraphStyle(style, depth, textDirection);

    return (
        <div style={{ position: 'relative' }}>
            {showAddresses && addr && <AddressBadge address={addr} />}
            <div style={paragraphStyle}>
                {content}
            </div>
            {children && children.length > 0 && (
                <div style={buildChildrenContainerStyle('container', depth, textDirection)}>
                    {children.map((child) => (
                        <UnifiedBlock
                            key={child.uid}
                            node={child}
                            depth={depth + 1}
                            textDirection={textDirection}
                            showAddresses={showAddresses}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * List item component for bullets and numbered items
 */
const ListItemBlock: React.FC<BlockProps> = ({ node, depth, textDirection, showAddresses }) => {
    const { title, text, style, children, addr } = node;
    const content = title || text || '';
    const marker = style?.listMarker || 'bullet';

    const listItemStyle = buildListItemStyle(style, depth, textDirection);
    const markerStyle = buildMarkerStyle(marker, textDirection);

    return (
        <div style={{ position: 'relative' }}>
            {showAddresses && addr && <AddressBadge address={addr} />}
            <div style={listItemStyle}>
                <span style={markerStyle}>
                    {getMarkerSymbol(marker)}
                </span>
                <span style={{ flex: 1 }}>
                    {content}
                </span>
            </div>
            {children && children.length > 0 && (
                <div style={buildChildrenContainerStyle('container', depth, textDirection)}>
                    {children.map((child) => (
                        <UnifiedBlock
                            key={child.uid}
                            node={child}
                            depth={depth + 1}
                            textDirection={textDirection}
                            showAddresses={showAddresses}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * Key-value component for label:value pairs
 */
const KeyValueBlock: React.FC<BlockProps> = ({ node, depth, textDirection, showAddresses }) => {
    const { title, text, style, children, addr } = node;

    const keyValueStyle = buildKeyValueStyle(style, depth, textDirection);

    return (
        <div style={{ position: 'relative' }}>
            {showAddresses && addr && <AddressBadge address={addr} />}
            <div style={keyValueStyle}>
                {title && (
                    <span style={{ fontWeight: 'semibold', marginRight: '0.5rem' }}>
                        {title}:
                    </span>
                )}
                {text && <span>{text}</span>}
            </div>
            {children && children.length > 0 && (
                <div style={buildChildrenContainerStyle('container', depth, textDirection)}>
                    {children.map((child) => (
                        <UnifiedBlock
                            key={child.uid}
                            node={child}
                            depth={depth + 1}
                            textDirection={textDirection}
                            showAddresses={showAddresses}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * Grid component for multi-column layouts
 */
const GridBlock: React.FC<BlockProps> = ({ node, depth, textDirection, showAddresses }) => {
    const { title, text, style, children, addr } = node;

    return (
        <div style={{ position: 'relative' }}>
            {showAddresses && addr && <AddressBadge address={addr} />}
            {(title || text) && (
                <div style={buildContainerHeaderStyle(style, depth, textDirection)}>
                    {title || text}
                </div>
            )}
            {children && children.length > 0 && (
                <div style={buildChildrenContainerStyle('grid', depth, textDirection)}>
                    {children.map((child) => (
                        <UnifiedBlock
                            key={child.uid}
                            node={child}
                            depth={depth + 1}
                            textDirection={textDirection}
                            showAddresses={showAddresses}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * Container component for generic grouping
 */
const ContainerBlock: React.FC<BlockProps> = ({ node, depth, textDirection, showAddresses }) => {
    const { title, text, style, children, addr } = node;

    return (
        <div style={{ position: 'relative' }}>
            {showAddresses && addr && <AddressBadge address={addr} />}
            {(title || text) && (
                <div style={buildContainerHeaderStyle(style, depth, textDirection)}>
                    {title || text}
                </div>
            )}
            {children && children.length > 0 && (
                <div style={buildChildrenContainerStyle('container', depth, textDirection)}>
                    {children.map((child) => (
                        <UnifiedBlock
                            key={child.uid}
                            node={child}
                            depth={depth + 1}
                            textDirection={textDirection}
                            showAddresses={showAddresses}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// =============================================================================
// STYLE BUILDERS
// =============================================================================

function buildHeadingStyle(style?: StyleHints, level?: number, textDirection?: 'ltr' | 'rtl'): React.CSSProperties {
    const baseStyle: React.CSSProperties = {
        fontSize: level === 1 ? '1.5rem' : level === 2 ? '1.25rem' : '1.125rem',
        fontWeight: style?.weight === 'bold' ? 700 : style?.weight === 'semibold' ? 600 : 700,
        color: '#1f2937',
        marginTop: level === 1 ? '2rem' : '1.5rem',
        marginBottom: '1rem',
        textAlign: textDirection === 'rtl' ? 'right' : 'left',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    };

    // Apply custom styles
    return {
        ...baseStyle,
        ...convertStyleHints(style)
    };
}

function buildParagraphStyle(style?: StyleHints, _depth?: number, textDirection?: 'ltr' | 'rtl'): React.CSSProperties {
    const baseStyle: React.CSSProperties = {
        fontSize: '0.9375rem',
        fontWeight: 400,
        color: '#374151',
        lineHeight: 1.6,
        marginBottom: '0.5rem',
        textAlign: textDirection === 'rtl' ? 'right' : 'left',
    };

    return {
        ...baseStyle,
        ...convertStyleHints(style)
    };
}

function buildListItemStyle(style?: StyleHints, _depth?: number, textDirection?: 'ltr' | 'rtl'): React.CSSProperties {
    const baseStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'flex-start',
        fontSize: '0.9375rem',
        fontWeight: 400,
        color: '#4b5563',
        lineHeight: 1.6,
        marginBottom: '0.375rem',
        textAlign: textDirection === 'rtl' ? 'right' : 'left',
    };

    return {
        ...baseStyle,
        ...convertStyleHints(style)
    };
}

function buildKeyValueStyle(style?: StyleHints, _depth?: number, textDirection?: 'ltr' | 'rtl'): React.CSSProperties {
    const baseStyle: React.CSSProperties = {
        fontSize: '0.9375rem',
        fontWeight: 400,
        color: '#374151',
        marginBottom: '0.25rem',
        textAlign: textDirection === 'rtl' ? 'right' : 'left',
    };

    return {
        ...baseStyle,
        ...convertStyleHints(style)
    };
}

function buildContainerHeaderStyle(style?: StyleHints, depth?: number, _textDirection?: 'ltr' | 'rtl'): React.CSSProperties {
    const baseStyle: React.CSSProperties = {
        fontSize: depth === 0 ? '1.125rem' : '1rem',
        fontWeight: depth === 0 ? 600 : 500,
        color: '#1f2937',
        marginBottom: '0.5rem',
        textAlign: _textDirection === 'rtl' ? 'right' : 'left',
    };

    return {
        ...baseStyle,
        ...convertStyleHints(style)
    };
}

function buildMarkerStyle(_marker: string, textDirection?: 'ltr' | 'rtl'): React.CSSProperties {
    return {
        display: 'inline-block',
        width: '1rem',
        marginRight: textDirection === 'rtl' ? '0' : '0.5rem',
        marginLeft: textDirection === 'rtl' ? '0.5rem' : '0',
        textAlign: 'center',
        flexShrink: 0,
    };
}

function buildChildrenContainerStyle(layout: LayoutKind, depth: number, textDirection: 'ltr' | 'rtl'): React.CSSProperties {
    const isRTL = textDirection === 'rtl';

    switch (layout) {
        case 'grid':
            return {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginTop: '0.5rem',
            };

        case 'container':
        default:
            return {
                display: 'flex',
                flexDirection: 'column',
                gap: depth > 0 ? '0.5rem' : '1rem',
                marginTop: depth === 0 ? '0.5rem' : '0.25rem',
                ...(depth > 0 ? (
                    isRTL ? { paddingRight: '1.5rem' } : { paddingLeft: '1.5rem' }
                ) : {})
            };
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getMarkerSymbol(marker: string): string {
    switch (marker) {
        case 'bullet':
            return '•';
        case 'dash':
            return '–';
        case 'number':
            return '1.'; // This would need to be dynamic in a real implementation
        case 'none':
            return '';
        default:
            return '•';
    }
}

function convertStyleHints(style?: StyleHints): React.CSSProperties {
    if (!style) return {};

    const cssStyle: React.CSSProperties = {};

    // Convert style hints to CSS properties
    if (style.fontSize) cssStyle.fontSize = style.fontSize;
    if (style.color) cssStyle.color = style.color;
    if (style.backgroundColor) cssStyle.backgroundColor = style.backgroundColor;
    if (style.marginTop) cssStyle.marginTop = style.marginTop;
    if (style.marginBottom) cssStyle.marginBottom = style.marginBottom;
    if (style.paddingLeft) cssStyle.paddingLeft = style.paddingLeft;
    if (style.paddingRight) cssStyle.paddingRight = style.paddingRight;
    if (style.borderBottom) cssStyle.borderBottom = style.borderBottom;
    if (style.lineHeight) cssStyle.lineHeight = style.lineHeight;
    if (style.align) cssStyle.textAlign = style.align;
    if (style.italic) cssStyle.fontStyle = 'italic';

    // Convert weight hints to CSS font-weight
    if (style.weight) {
        switch (style.weight) {
            case 'regular':
                cssStyle.fontWeight = 400;
                break;
            case 'medium':
                cssStyle.fontWeight = 500;
                break;
            case 'semibold':
                cssStyle.fontWeight = 600;
                break;
            case 'bold':
                cssStyle.fontWeight = 700;
                break;
        }
    }

    return cssStyle;
}

/**
 * Address badge component for hover UI
 */
const AddressBadge: React.FC<{ address: string }> = ({ address }) => {
    return (
        <div
            style={{
                position: 'absolute',
                top: '-8px',
                left: '-24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontSize: '0.75rem',
                padding: '2px 6px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                zIndex: 10,
                opacity: 0.8,
            }}
            title={`Address: ${address}`}
        >
            {address}
        </div>
    );
};