import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageUploader } from "../ImageUploader";

describe("ImageUploader", () => {
  const defaultProps = {
    onImageSelect: vi.fn(),
    onClear: vi.fn(),
    selectedImage: null,
    isAnalyzing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload area when no image is selected", () => {
    render(<ImageUploader {...defaultProps} />);

    expect(
      screen.getByText("이미지를 드래그하거나 클릭하여 업로드")
    ).toBeInTheDocument();
    expect(screen.getByText("JPG, PNG, WebP, GIF • 최대 10MB")).toBeInTheDocument();
  });

  it("renders image preview when image is selected", () => {
    const props = {
      ...defaultProps,
      selectedImage: "data:image/png;base64,test",
    };

    render(<ImageUploader {...props} />);

    const img = screen.getByAltText("업로드된 이미지");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "data:image/png;base64,test");
  });

  it("shows clear button when image is selected and not analyzing", () => {
    const props = {
      ...defaultProps,
      selectedImage: "data:image/png;base64,test",
      isAnalyzing: false,
    };

    render(<ImageUploader {...props} />);

    // Clear button should be visible (X icon button)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("hides clear button when analyzing", () => {
    const props = {
      ...defaultProps,
      selectedImage: "data:image/png;base64,test",
      isAnalyzing: true,
    };

    render(<ImageUploader {...props} />);

    // Clear button should not be visible when analyzing
    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBe(0);
  });

  it("calls onClear when clear button is clicked", () => {
    const props = {
      ...defaultProps,
      selectedImage: "data:image/png;base64,test",
    };

    render(<ImageUploader {...props} />);

    const clearButton = screen.getByRole("button");
    fireEvent.click(clearButton);

    expect(props.onClear).toHaveBeenCalledTimes(1);
  });

  it("shows error message for unsupported file type", async () => {
    render(<ImageUploader {...defaultProps} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "test.txt", { type: "text/plain" });

    Object.defineProperty(input, "files", {
      value: [file],
    });

    fireEvent.change(input);

    expect(
      await screen.findByText("지원하지 않는 파일 형식입니다. (JPG, PNG, WebP, GIF만 가능)")
    ).toBeInTheDocument();
  });

  it("shows drag indicator when dragging over", () => {
    render(<ImageUploader {...defaultProps} />);

    const dropZone = screen.getByText("이미지를 드래그하거나 클릭하여 업로드").closest("div")?.parentElement;

    if (dropZone) {
      fireEvent.dragOver(dropZone);
      expect(screen.getByText("여기에 놓으세요")).toBeInTheDocument();
    }
  });
});
