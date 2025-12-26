import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UrlInput } from "../UrlInput";

describe("UrlInput", () => {
  const mockOnUrlSubmit = vi.fn();

  const defaultProps = {
    onUrlSubmit: mockOnUrlSubmit,
    isLoading: false,
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("URL 타입 감지", () => {
    it("이미지 URL 입력 시 성공 메시지를 표시한다", () => {
      render(<UrlInput {...defaultProps} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, {
        target: { value: "https://example.com/image.jpg" },
      });

      expect(screen.getByText("이미지 URL 감지됨")).toBeInTheDocument();
    });

    it("웹페이지 URL 입력 시 에러 메시지를 표시한다", () => {
      render(<UrlInput {...defaultProps} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, {
        target: { value: "https://example.com/page" },
      });

      expect(
        screen.getByText(/직접 이미지 URL만 지원됩니다/)
      ).toBeInTheDocument();
    });

    it("웹페이지 URL 입력 시 제출 버튼이 비활성화된다", () => {
      render(<UrlInput {...defaultProps} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, {
        target: { value: "https://example.com/page" },
      });

      const submitButton = screen.getByRole("button", { name: "분석" });
      expect(submitButton).toBeDisabled();
    });

    it("이미지 URL 입력 시 제출 버튼이 활성화된다", () => {
      render(<UrlInput {...defaultProps} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, {
        target: { value: "https://example.com/image.png" },
      });

      const submitButton = screen.getByRole("button", { name: "분석" });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("알려진 이미지 호스팅 서비스", () => {
    it("imgur URL을 이미지로 인식한다", () => {
      render(<UrlInput {...defaultProps} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, {
        target: { value: "https://i.imgur.com/abc123" },
      });

      expect(screen.getByText("이미지 URL 감지됨")).toBeInTheDocument();
    });

    it("Twitter/X 이미지 URL을 인식한다", () => {
      render(<UrlInput {...defaultProps} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, {
        target: { value: "https://pbs.twimg.com/media/abc123" },
      });

      expect(screen.getByText("이미지 URL 감지됨")).toBeInTheDocument();
    });
  });

  describe("제출 동작", () => {
    it("이미지 URL 제출 시 onUrlSubmit이 호출된다", () => {
      render(<UrlInput {...defaultProps} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, {
        target: { value: "https://example.com/image.jpg" },
      });

      const submitButton = screen.getByRole("button", { name: "분석" });
      fireEvent.click(submitButton);

      expect(mockOnUrlSubmit).toHaveBeenCalledWith(
        "https://example.com/image.jpg"
      );
    });

    it("Enter 키로 제출할 수 있다", () => {
      render(<UrlInput {...defaultProps} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, {
        target: { value: "https://example.com/image.jpg" },
      });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockOnUrlSubmit).toHaveBeenCalledWith(
        "https://example.com/image.jpg"
      );
    });

    it("웹페이지 URL은 제출되지 않는다", () => {
      render(<UrlInput {...defaultProps} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, {
        target: { value: "https://example.com/page" },
      });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockOnUrlSubmit).not.toHaveBeenCalled();
    });
  });

  describe("로딩 및 비활성화 상태", () => {
    it("로딩 중에는 버튼이 비활성화된다", () => {
      render(<UrlInput {...defaultProps} isLoading={true} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, {
        target: { value: "https://example.com/image.jpg" },
      });

      const submitButton = screen.getByRole("button");
      expect(submitButton).toBeDisabled();
    });

    it("disabled 상태에서는 입력이 비활성화된다", () => {
      render(<UrlInput {...defaultProps} disabled={true} />);

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });
  });
});
