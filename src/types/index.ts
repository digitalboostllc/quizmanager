export interface Collection {
    id: string
    name: string
    description?: string
    userId: string
    itemCount: number
    createdAt: string
    updatedAt: string
}

export interface CollectionItem {
    id: string
    collectionId: string
    contentId: string
    content: ContentUsage
    createdAt: string
    updatedAt: string
} 