import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { ArchiveItem } from '../types/story';

// Fonts are currently disabled to fix 404 errors. Using standard PDF fonts.
// Font.register({
//   family: 'Playfair Display',
//   fonts: [
//     { src: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff2', fontWeight: 400 },
//     { src: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKebvXDXbtM.woff2', fontWeight: 700 },
//   ],
// });

// Font.register({
//   family: 'Libre Baskerville',
//   fonts: [
//     { src: 'https://fonts.gstatic.com/s/librebaskerville/v14/kmKnZrc3Hgbbcjq75U4uslyuy4kn0qviTjYw.woff2', fontWeight: 400 },
//     { src: 'https://fonts.gstatic.com/s/librebaskerville/v14/kmKiZrc3Hgbbcjq75U4uslyuy4kn0qviTgY5Krg.woff2', fontWeight: 700 },
//   ],
// });

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Times-Roman', // Standard font
        fontSize: 10,
        lineHeight: 1.5,
        color: '#2b2013',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#333',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerText: {
        fontFamily: 'Times-Roman',
        fontSize: 10,
        textTransform: 'uppercase',
        color: '#666',
        fontWeight: 700,
    },
    masthead: {
        textAlign: 'center',
        marginBottom: 20,
        borderBottomWidth: 3,
        borderBottomColor: '#222',
        borderBottomStyle: 'solid', // double not supported, simulate with solid
        paddingBottom: 15,
    },
    title: {
        fontFamily: 'Times-Roman',
        fontSize: 48,
        textAlign: 'center',
        fontWeight: 700,
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    tagline: {
        fontSize: 10,
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#5c4322',
    },
    meta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#222',
        paddingVertical: 5,
        marginBottom: 15,
        fontSize: 8,
        textTransform: 'uppercase',
        fontFamily: 'Times-Roman',
        fontWeight: 700,
    },
    mainStory: {
        marginBottom: 20,
    },
    headline: {
        fontFamily: 'Times-Roman',
        fontSize: 24,
        fontWeight: 700,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    byline: {
        fontSize: 8,
        textTransform: 'uppercase',
        color: '#5c4322',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingBottom: 5,
    },
    image: {
        width: '100%',
        height: 300,
        objectFit: 'cover',
        marginBottom: 10,
    },
    caption: {
        fontSize: 8,
        fontStyle: 'italic',
        color: '#666',
        marginBottom: 10,
        backgroundColor: '#f8f6f3',
        padding: 5,
    },
    body: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 20,
    },
    column: {
        width: '48%',
        textAlign: 'justify',
    },
    separator: {
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        height: 3,
        marginVertical: 20,
        width: '50%',
        alignSelf: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#888',
    },
    pageNumber: {
        position: 'absolute',
        right: 0,
        fontSize: 8,
        color: '#888',
    },
});

interface NewspaperPDFProps {
    stories: ArchiveItem[];
    volume?: number;
    issueNo?: number;
}

// Helper to strip HTML tags
const stripHtml = (html: string) => {
    return html.replace(/<[^>]+>/g, '');
};

export const NewspaperPDF: React.FC<NewspaperPDFProps> = ({ stories, volume = 1, issueNo = 1 }) => {
    const mainStory = stories[0];
    const otherStories = stories.slice(1);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerText}>DigiTimes Edition</Text>
                    <Text style={styles.headerText}>{new Date().toLocaleDateString()}</Text>
                </View>

                {/* Masthead */}
                <View style={styles.masthead}>
                    <View style={styles.meta}>
                        <Text>Vol. {volume}, No. {issueNo}</Text>
                        <Text>$1.00</Text>
                    </View>
                    <Text style={styles.title}>DigiTimes</Text>
                    <Text style={styles.tagline}>"Your Memories, Front Page News"</Text>
                </View>

                {/* Main Story */}
                {mainStory && (
                    <View style={styles.mainStory}>
                        {mainStory.imageUrl && (
                            <>
                                <Image src={mainStory.imageUrl} style={styles.image} />
                                {mainStory.prompt && (
                                    <Text style={styles.caption}>{mainStory.prompt}</Text>
                                )}
                            </>
                        )}
                        <Text style={styles.headline}>{mainStory.title || 'Untitled Feature'}</Text>
                        <Text style={styles.byline}>By DigiTimes Staff</Text>

                        <View style={styles.body}>
                            <View style={styles.column}>
                                <Text>
                                    {stripHtml(mainStory.article || mainStory.prompt || '').slice(0, 1000)}
                                </Text>
                            </View>
                            <View style={styles.column}>
                                <Text>
                                    {stripHtml(mainStory.article || mainStory.prompt || '').slice(1000)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Separator */}
                {otherStories.length > 0 && <View style={styles.separator} />}

                {/* Other Stories (simplified for now, just listing titles) */}
                {otherStories.map((story, index) => (
                    <View key={story.id} style={{ marginBottom: 15 }}>
                        <Text style={[styles.headline, { fontSize: 18 }]}>{story.title}</Text>
                        <Text style={{ fontSize: 9 }}>{stripHtml(story.article || story.prompt || '').slice(0, 300)}...</Text>
                    </View>
                ))}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Created with DigiTimes</Text>
                    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
                        `Page ${pageNumber} of ${totalPages}`
                    )} fixed />
                </View>
            </Page>
        </Document>
    );
};
