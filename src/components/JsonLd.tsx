interface JsonLdProps {
  type: 'WebApplication' | 'FAQPage' | 'Organization'
}

export function JsonLd({ type }: JsonLdProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-detector.vercel.app'

  const schemas = {
    WebApplication: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'AI Detector',
      description: '이미지가 AI로 생성되었는지 즉시 판별합니다. 딥페이크, Midjourney, DALL-E 등 AI 이미지를 95% 정확도로 탐지합니다.',
      url: appUrl,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      softwareVersion: '1.0.0',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KRW',
        description: '무료 5회 제공, 이후 유료 크레딧 구매',
      },
      featureList: [
        'AI 생성 이미지 판별',
        '딥페이크 탐지',
        '디지털 핑거프린트 분석',
        '주파수 분석',
        '메타데이터 추출',
        'URL 직접 분석',
        '파일 업로드 지원',
      ],
      screenshot: `${appUrl}/api/og`,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '150',
        bestRating: '5',
        worstRating: '1',
      },
    },
    FAQPage: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'AI 이미지 판별은 어떻게 작동하나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'AI Detector는 디지털 핑거프린트, 주파수 분석, 메타데이터 검사 등 여러 기술을 조합하여 이미지가 AI로 생성되었는지 판별합니다.',
          },
        },
        {
          '@type': 'Question',
          name: '무료로 사용할 수 있나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '네, 처음 5회는 무료로 사용할 수 있습니다. 이후에는 소액의 크레딧을 구매하여 계속 사용할 수 있습니다.',
          },
        },
        {
          '@type': 'Question',
          name: '어떤 AI 이미지를 탐지할 수 있나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Midjourney, DALL-E, Stable Diffusion, Leonardo AI 등 대부분의 AI 이미지 생성 도구로 만든 이미지를 탐지할 수 있습니다.',
          },
        },
      ],
    },
    Organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'AI Detector',
      url: appUrl,
      logo: `${appUrl}/icon.png`,
      sameAs: [
        'https://twitter.com/ai_detector',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        availableLanguage: ['Korean', 'English'],
      },
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas[type]) }}
    />
  )
}

export function WebApplicationJsonLd() {
  return <JsonLd type="WebApplication" />
}

export function FAQPageJsonLd() {
  return <JsonLd type="FAQPage" />
}

export function OrganizationJsonLd() {
  return <JsonLd type="Organization" />
}
