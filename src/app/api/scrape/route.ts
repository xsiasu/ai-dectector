import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

interface ScrapeResult {
  imageUrl: string;
  title: string | null;
  source: string;
}

function resolveUrl(baseUrl: string, relativeUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return relativeUrl;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL이 필요합니다." },
        { status: 400 }
      );
    }

    // Fetch the webpage
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Get page title
    const title =
      $("meta[property='og:title']").attr("content") ||
      $("title").text() ||
      null;

    // Priority 1: OpenGraph image
    let imageUrl = $("meta[property='og:image']").attr("content");

    // Priority 2: Twitter image
    if (!imageUrl) {
      imageUrl = $("meta[name='twitter:image']").attr("content");
    }

    // Priority 3: First large image in the page
    if (!imageUrl) {
      const images = $("img")
        .map((_, el) => {
          const src = $(el).attr("src");
          const width = parseInt($(el).attr("width") || "0", 10);
          const height = parseInt($(el).attr("height") || "0", 10);
          return { src, width, height, area: width * height };
        })
        .get()
        .filter((img) => img.src && !img.src.includes("data:image"))
        .sort((a, b) => b.area - a.area);

      if (images.length > 0) {
        imageUrl = images[0].src;
      }
    }

    // Priority 4: Any image with reasonable src
    if (!imageUrl) {
      const firstImg = $("img[src]").first().attr("src");
      if (firstImg && !firstImg.includes("data:image")) {
        imageUrl = firstImg;
      }
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "페이지에서 이미지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Resolve relative URLs
    const absoluteImageUrl = resolveUrl(url, imageUrl);

    const result: ScrapeResult = {
      imageUrl: absoluteImageUrl,
      title,
      source: url,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Scrape error:", error);

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        return NextResponse.json(
          { error: "요청 시간이 초과되었습니다." },
          { status: 408 }
        );
      }
      if (error.response?.status === 404) {
        return NextResponse.json(
          { error: "페이지를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "페이지를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
