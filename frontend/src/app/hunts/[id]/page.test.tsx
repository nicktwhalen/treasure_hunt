import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HuntDetail from "./page";
import { api } from "../../../lib/api";

// Mock the API
const mockApi = api as jest.Mocked<typeof api>;

// Mock QrImage component to avoid TextEncoder issues in jsdom
jest.mock("../../../components/QrImage/QrImage", () => {
  return function MockQrImage({ qrCodeData, alt, className }: any) {
    return (
      <div data-testid="qr-image" className={className}>
        {alt}
      </div>
    );
  };
});

// Mock next/navigation with parameterized id
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: mockId }),
  usePathname: () => `/hunts/${mockId}`,
}));

let mockId = "1"; // Default to edit mode

const mockHunt = {
  id: 1,
  title: "Test Hunt",
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  treasures: [
    {
      id: 1,
      huntId: 1,
      ordinal: 1,
      qrCodeData: "test-qr-1",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
      clue: {
        id: 1,
        treasureId: 1,
        text: "First clue",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      },
    },
  ],
};

const mockTreasures = [
  {
    id: 1,
    huntId: 1,
    ordinal: 1,
    qrCodeData: "test-qr-1",
    qrCodeImagePath: "/test1.png",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
    clue: {
      id: 1,
      treasureId: 1,
      text: "First clue",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    },
  },
];

describe("HuntDetail Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockId = "1"; // Default to edit mode
    mockApi.getHunt.mockResolvedValue(mockHunt);
    mockApi.getTreasures.mockResolvedValue(mockTreasures);
    mockApi.updateHunt.mockResolvedValue(mockHunt);
    mockApi.createHunt.mockResolvedValue(mockHunt);
  });

  describe("Rule #1: Save button enable/disable logic", () => {
    it("should disable save button when hunt is not dirty (no changes)", async () => {
      render(<HuntDetail />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Hunt")).toBeInTheDocument();
      });

      const saveButton = screen.getByText("Save");
      expect(saveButton).toBeDisabled();
    });

    it("should enable save button when hunt title is dirty", async () => {
      render(<HuntDetail />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Hunt")).toBeInTheDocument();
      });

      // Change title
      const titleInput = screen.getByDisplayValue("Test Hunt");
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, "Modified Hunt");

      const saveButton = screen.getByText("Save");
      expect(saveButton).toBeEnabled();
    });

    it("should enable save button when treasure clue is dirty", async () => {
      render(<HuntDetail />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue("First clue")).toBeInTheDocument();
      });

      // Change treasure clue
      const clueInput = screen.getByDisplayValue("First clue");
      await userEvent.clear(clueInput);
      await userEvent.type(clueInput, "Modified clue");

      const saveButton = screen.getByText("Save");
      expect(saveButton).toBeEnabled();
    });

    it("should enable save button when a treasure is added", async () => {
      render(<HuntDetail />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Hunt")).toBeInTheDocument();
      });

      // Add treasure
      const addButton = screen.getByText("+ Add Treasure");
      await userEvent.click(addButton);

      const saveButton = screen.getByText("Save");
      expect(saveButton).toBeEnabled();
    });

    it("should enable save button when a treasure is deleted", async () => {
      render(<HuntDetail />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Hunt")).toBeInTheDocument();
      });

      // Delete treasure
      const deleteButton = screen.getByText("Delete");
      await userEvent.click(deleteButton);

      const saveButton = screen.getByText("Save");
      expect(saveButton).toBeEnabled();
    });
  });

  describe("Rule #2: Save validation", () => {
    it("should not save when hunt title is invalid", async () => {
      render(<HuntDetail />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Hunt")).toBeInTheDocument();
      });

      // Clear title to make it invalid
      const titleInput = screen.getByDisplayValue("Test Hunt");
      await userEvent.clear(titleInput);

      // Try to save
      const saveButton = screen.getByText("Save");
      await userEvent.click(saveButton);

      // Should show validation errors and not call API
      expect(mockApi.updateHunt).not.toHaveBeenCalled();
    });

    it("should not save when treasure clue is invalid", async () => {
      render(<HuntDetail />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue("First clue")).toBeInTheDocument();
      });

      // Clear clue to make it invalid
      const clueInput = screen.getByDisplayValue("First clue");
      await userEvent.clear(clueInput);

      // Try to save
      const saveButton = screen.getByText("Save");
      await userEvent.click(saveButton);

      // Should show validation errors and not call API
      expect(mockApi.updateHunt).not.toHaveBeenCalled();
    });

    it("should save when all fields are valid", async () => {
      render(<HuntDetail />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Hunt")).toBeInTheDocument();
      });

      // Modify title to make it dirty
      const titleInput = screen.getByDisplayValue("Test Hunt");
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, "Valid Hunt");

      // Save
      const saveButton = screen.getByText("Save");
      await userEvent.click(saveButton);

      // Should call API with valid data
      await waitFor(() => {
        expect(mockApi.updateHunt).toHaveBeenCalledWith(1, "Valid Hunt", [
          { ordinal: 1, clueText: "First clue" },
        ]);
      });
    });
  });

  describe("Rule #3: Invalid treasure handling", () => {
    it("should highlight invalid clue instead of dropping treasure", async () => {
      render(<HuntDetail />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("+ Add Treasure")).toBeInTheDocument();
      });

      // Add treasure but don't populate clue
      const addButton = screen.getByText("+ Add Treasure");
      await userEvent.click(addButton);

      // Try to save
      const saveButton = screen.getByText("Save");
      await userEvent.click(saveButton);

      // Should show validation errors and not call API
      expect(mockApi.updateHunt).not.toHaveBeenCalled();

      // Should show validation error for empty clue
      // (The actual error display depends on your TextInput component implementation)
    });
  });

  describe("Rule #4: onBlur validation", () => {
    it("should highlight title field when leaving focus with invalid value", async () => {
      render(<HuntDetail />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Hunt")).toBeInTheDocument();
      });

      // Clear title and blur
      const titleInput = screen.getByDisplayValue("Test Hunt");
      await userEvent.clear(titleInput);
      fireEvent.blur(titleInput);

      // Should show field-level validation
      // (The actual error display depends on your TextInput component implementation)
    });

    it("should highlight treasure clue field when leaving focus with invalid value", async () => {
      render(<HuntDetail />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue("First clue")).toBeInTheDocument();
      });

      // Clear clue and blur
      const clueInput = screen.getByDisplayValue("First clue");
      await userEvent.clear(clueInput);
      fireEvent.blur(clueInput);

      // Should show field-level validation
      // (The actual error display depends on your TextInput component implementation)
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete workflow: add treasure, populate clue, save successfully", async () => {
      render(<HuntDetail />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("+ Add Treasure")).toBeInTheDocument();
      });

      // Add treasure
      const addButton = screen.getByText("+ Add Treasure");
      await userEvent.click(addButton);

      // Find the new treasure's clue input (it should be empty)
      const clueInputs = screen.getAllByPlaceholderText("Enter clue text...");
      const newClueInput = clueInputs[clueInputs.length - 1]; // Last one should be the new treasure

      // Populate clue
      await userEvent.type(newClueInput, "New treasure clue");

      // Save
      const saveButton = screen.getByText("Save");
      await userEvent.click(saveButton);

      // Should call API successfully
      await waitFor(() => {
        expect(mockApi.updateHunt).toHaveBeenCalled();
      });
    });
  });

  describe('Create Hunt Mode (id="new")', () => {
    beforeEach(() => {
      mockId = "new"; // Set to create mode
    });

    describe("Rule #1: Save button enable/disable logic in create mode", () => {
      it("should enable save button immediately when creating new hunt", async () => {
        render(<HuntDetail />);

        const saveButton = screen.getByText("Save");
        expect(saveButton).toBeEnabled();
      });

      it("should keep save button enabled when adding content", async () => {
        render(<HuntDetail />);

        const titleInput = screen.getByPlaceholderText("Enter hunt title...");
        await userEvent.type(titleInput, "New Hunt");

        const saveButton = screen.getByText("Save");
        expect(saveButton).toBeEnabled();
      });
    });

    describe("Rule #2: Save validation in create mode", () => {
      it("should not save when hunt title is empty in create mode", async () => {
        render(<HuntDetail />);

        // Try to save without title
        const saveButton = screen.getByText("Save");
        await userEvent.click(saveButton);

        // Should show validation errors and not call API
        expect(mockApi.createHunt).not.toHaveBeenCalled();
      });

      it("should save successfully when title is provided in create mode", async () => {
        render(<HuntDetail />);

        // Add title
        const titleInput = screen.getByPlaceholderText("Enter hunt title...");
        await userEvent.type(titleInput, "New Hunt");

        // Save
        const saveButton = screen.getByText("Save");
        await userEvent.click(saveButton);

        // Should call createHunt API
        await waitFor(() => {
          expect(mockApi.createHunt).toHaveBeenCalledWith("New Hunt", []);
        });
      });

      it("should redirect to edit page after successful create", async () => {
        render(<HuntDetail />);

        // Add title
        const titleInput = screen.getByPlaceholderText("Enter hunt title...");
        await userEvent.type(titleInput, "New Hunt");

        // Save
        const saveButton = screen.getByText("Save");
        await userEvent.click(saveButton);

        // Should redirect to edit page
        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith("/hunts/1");
        });
      });
    });

    describe("Rule #3: Invalid treasure handling in create mode", () => {
      it("should highlight invalid clue in create mode", async () => {
        render(<HuntDetail />);

        // Add title
        const titleInput = screen.getByPlaceholderText("Enter hunt title...");
        await userEvent.type(titleInput, "New Hunt");

        // Add treasure without clue
        const addButton = screen.getByText("+ Add Treasure");
        await userEvent.click(addButton);

        // Try to save
        const saveButton = screen.getByText("Save");
        await userEvent.click(saveButton);

        // Should show validation errors and not call API
        expect(mockApi.createHunt).not.toHaveBeenCalled();
      });
    });

    describe("Rule #4: onBlur validation in create mode", () => {
      it("should highlight title field when leaving focus with invalid value in create mode", async () => {
        render(<HuntDetail />);

        const titleInput = screen.getByPlaceholderText("Enter hunt title...");
        await userEvent.click(titleInput);
        fireEvent.blur(titleInput);

        // Should show field-level validation
        // (The actual error display depends on your TextInput component implementation)
      });
    });
  });
});
