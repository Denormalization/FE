import { ReactNode } from 'react';

export interface NavItem {
    icon: ReactNode;
    title: string;
    onClick?: () => void;
}

export interface NavigationProps {
    items: NavItem[];
}

export interface BookProps {
    leftContent?: ReactNode;
    rightContent: ReactNode;
}