import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
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
        paddingTop: 70,
        paddingBottom: 60,
        paddingHorizontal: 50,
        fontFamily: 'Times-Roman',
        fontSize: 11,
        lineHeight: 1.6,
        color: '#1a1a1a',
    },
    header: {
        position: 'absolute',
        top: 25,
        left: 50,
        right: 50,
        borderBottomWidth: 2,
        borderBottomColor: '#000',
        paddingBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerText: {
        fontFamily: 'Times-Bold',
        fontSize: 9,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: '#333',
    },
    masthead: {
        textAlign: 'center',
        marginBottom: 25,
        borderBottomWidth: 4,
        borderBottomColor: '#000',
        paddingBottom: 20,
    },
    mastheadTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#000',
        paddingVertical: 6,
        marginBottom: 12,
        fontSize: 8,
        letterSpacing: 0.5,
    },
    title: {
        fontFamily: 'Times-Bold',
        fontSize: 52,
        textAlign: 'center',
        letterSpacing: 3,
        textTransform: 'uppercase',
        marginBottom: 8,
        color: '#000',
    },
    tagline: {
        fontSize: 11,
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#444',
        marginTop: 4,
    },
    mainStory: {
        marginBottom: 30,
    },
    headline: {
        fontFamily: 'Times-Bold',
        fontSize: 26,
        lineHeight: 1.2,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#000',
    },
    subheadline: {
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 8,
        color: '#333',
    },
    byline: {
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        color: '#666',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 8,
    },
    imageContainer: {
        marginBottom: 12,
        border: '1px solid #ddd',
    },
    image: {
        width: '100%',
        maxHeight: 350,
        objectFit: 'cover',
    },
    caption: {
        fontSize: 9,
        fontStyle: 'italic',
        color: '#555',
        padding: 8,
        backgroundColor: '#f5f5f5',
        borderTop: '1px solid #ddd',
    },
    bodyColumns: {
        flexDirection: 'row',
        gap: 25,
        marginTop: 12,
    },
    column: {
        flex: 1,
        textAlign: 'justify',
        fontSize: 11,
        lineHeight: 1.7,
    },
    separator: {
        width: 80,
        height: 1,
        backgroundColor: '#999',
        alignSelf: 'center',
        marginVertical: 25,
    },
    sideStory: {
        marginBottom: 25,
        paddingBottom: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    sideHeadline: {
        fontFamily: 'Times-Bold',
        fontSize: 16,
        lineHeight: 1.3,
        marginBottom: 8,
        textTransform: 'uppercase',
        color: '#000',
    },
    sideImage: {
        width: '100%',
        height: 180,
        objectFit: 'cover',
        marginBottom: 10,
        border: '1px solid #ddd',
    },
    footer: {
        position: 'absolute',
        bottom: 25,
        left: 50,
        right: 50,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#666',
    },
});

interface NewspaperPDFProps {
    stories: ArchiveItem[];
    volume?: number;
    issueNo?: number;
}

// Helper to strip HTML tags
const stripHtml = (html: string) => {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

export const NewspaperPDF: React.FC<NewspaperPDFProps> = ({ stories, volume = 1, issueNo = 1 }) => {
    const mainStory = stories[0];
    const sideStories = stories.slice(1);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Fixed Header */}
                <View style={styles.header} fixed>
                    <Text style={styles.headerText}>DigiTimes</Text>
                    <Text style={styles.headerText}>{new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</Text>
                </View>

                {/* Masthead */}
                <View style={styles.masthead}>
                    <View style={styles.mastheadTop}>
                        <Text>Vol. {volume}, No. {issueNo}</Text>
                        <Text>Your Personal Edition</Text>
                        <Text>DigiTimes.com</Text>
                    </View>
                    <Text style={styles.title}>THE DIGITIMES</Text>
                    <Text style={styles.tagline}>"All the Memories Fit to Print"</Text>
                </View>

                {/* Main Feature Story */}
                {mainStory && (
                    <View style={styles.mainStory}>
                        <Text style={styles.headline}>{mainStory.title || 'Untitled Story'}</Text>
                        {mainStory.prompt && (
                            <Text style={styles.subheadline}>{mainStory.prompt}</Text>
                        )}
                        <Text style={styles.byline}>By DigiTimes Staff</Text>

                        {(mainStory.imageUrl || mainStory.base64Image) && (
                            <View style={styles.imageContainer}>
                                <Image
                                    src={mainStory.imageUrl || mainStory.base64Image || ''}
                                    style={styles.image}
                                    cache={false}
                                />
                                {mainStory.prompt && (
                                    <Text style={styles.caption}>{mainStory.prompt}</Text>
                                )}
                            </View>
                        )}

                        <View style={styles.bodyColumns}>
                            <View style={styles.column}>
                                <Text>
                                    {stripHtml(mainStory.article || mainStory.prompt || 'No content available.').slice(0, 800)}
                                </Text>
                            </View>
                            <View style={styles.column}>
                                <Text>
                                    {stripHtml(mainStory.article || mainStory.prompt || '').slice(800, 1600)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Separator */}
                {sideStories.length > 0 && <View style={styles.separator} />}

                {/* Additional Stories */}
                {sideStories.map((story, index) => (
                    <View key={story.id} style={styles.sideStory} break={index > 1}>
                        <Text style={styles.sideHeadline}>{story.title || 'Untitled'}</Text>

                        {(story.imageUrl || story.base64Image) && (
                            <Image
                                src={story.imageUrl || story.base64Image || ''}
                                style={styles.sideImage}
                                cache={false}
                            />
                        )}

                        <Text style={{ fontSize: 10, lineHeight: 1.6, textAlign: 'justify' }}>
                            {stripHtml(story.article || story.prompt || 'No content available.').slice(0, 600)}
                            {stripHtml(story.article || story.prompt || '').length > 600 ? '...' : ''}
                        </Text>
                    </View>
                ))}

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>© {new Date().getFullYear()} DigiTimes • Created with DigiTimes</Text>
                    <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
                        `Page ${pageNumber} of ${totalPages}`
                    } />
                </View>
            </Page>
        </Document>
    );
};
