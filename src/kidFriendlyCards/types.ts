export interface KidFriendlyCardTab {
    id: string;
    title: string;
    description: string;
    points: string[];
}

export interface KidFriendlyCardData {
    chineseName: string;
    englishName: string;
    summary: string;
    emoji: string;
    tags: string[];
    tabs: KidFriendlyCardTab[];
    callToAction?: string;
}
