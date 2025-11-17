import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Templates from '../pages/Templates';
import UploadPhoto from '../components/UploadPhoto';
import PhotoGallery from '../components/PhotoGallery';
import { getSupabase } from '../lib/supabaseClient';
import { fetchAllTemplates } from '../lib/templates';

jest.mock('../lib/supabaseClient', () => {
  const supabaseInstance = {
    storage: { from: jest.fn() },
  };
  const getSupabaseMock = jest.fn(() => supabaseInstance);
  return {
    supabase: supabaseInstance,
    supabaseClient: supabaseInstance,
    getSupabase: getSupabaseMock,
  };
});

jest.mock('../lib/templates', () => ({
  fetchAllTemplates: jest.fn(),
}));

const supabaseModule = jest.requireMock('../lib/supabaseClient') as {
  getSupabase: jest.Mock;
  supabase: {
    storage: { from: jest.Mock };
  };
};

const mockSupabase = supabaseModule.supabase;
const mockGetSupabase = supabaseModule.getSupabase as jest.MockedFunction<typeof getSupabase>;
const mockFetchAllTemplates =
  fetchAllTemplates as jest.MockedFunction<typeof fetchAllTemplates>;

mockGetSupabase.mockReturnValue(mockSupabase as any);

const originalCrypto = globalThis.crypto;

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      randomUUID: jest.fn(() => 'test-uuid'),
    },
  });
});

afterAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: originalCrypto,
  });
});

afterEach(() => {
  jest.resetAllMocks();
  mockSupabase.storage.from = jest.fn();
  mockGetSupabase.mockReturnValue(mockSupabase as any);
});

test('Templates renders public rows from Supabase', async () => {
  mockFetchAllTemplates.mockResolvedValue([
    {
      id: '1',
      slug: 'welcome-template',
      title: 'Welcome Template',
      html: '<article/>',
      css: '',
      isSystem: true,
      owner: null,
    },
  ] as any);

  render(<Templates />);

  await waitFor(() => {
    expect(screen.getByText('Welcome Template')).toBeInTheDocument();
  });
  expect(screen.getByText('welcome-template')).toBeInTheDocument();
  expect(mockFetchAllTemplates).toHaveBeenCalled();
});

test('Templates shows an empty state when no templates resolve', async () => {
  mockFetchAllTemplates.mockResolvedValue([]);

  render(<Templates />);

  await waitFor(() => {
    expect(screen.getByText(/No templates available right now/i)).toBeInTheDocument();
  });
});

test('UploadPhoto uploads an image and surfaces the public URL', async () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const upload = jest.fn().mockResolvedValue({ error: null });
    const getPublicUrl = jest.fn().mockReturnValue({
      data: { publicUrl: 'https://cdn.example.com/public/demo.png' },
    });
    const from = jest.fn(() => ({
      upload,
      getPublicUrl,
    }));

    mockSupabase.storage.from = from;
    mockGetSupabase.mockReturnValue(mockSupabase as any);

    const file = new File(['demo'], 'demo.png', { type: 'image/png' });
    const { container } = render(<UploadPhoto />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);
    expect(input.files).toHaveLength(1);
    expect(input.files?.[0]).toBe(file);
    await userEvent.click(screen.getByRole('button', { name: /upload/i }));

    await waitFor(() => {
      expect(screen.getByText(/Uploaded!/)).toBeInTheDocument();
    });

    expect(upload).toHaveBeenCalledTimes(1);
    const [pathArg, fileArg, optionsArg] = upload.mock.calls[0];
    expect(pathArg).toMatch(/^anonymous\/.*\.png$/);
    expect(fileArg).toBe(file);
    expect(optionsArg).toMatchObject({
      upsert: false,
      contentType: 'image/png',
    });
    expect(getPublicUrl).toHaveBeenCalledWith(pathArg);
  } finally {
    consoleSpy.mockRestore();
  }
});

test('PhotoGallery lists public images', async () => {
  const list = jest.fn().mockResolvedValue({
    data: [{ name: 'demo.png' }],
    error: null,
  });
  const from = jest.fn(() => ({
    list,
  }));

  mockSupabase.storage.from = from;
  mockGetSupabase.mockReturnValue(mockSupabase as any);

  render(<PhotoGallery />);

  await waitFor(() => {
    const img = screen.getByAltText('demo.png') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('/storage/v1/object/public/photos/anonymous%2Fdemo.png');
  });

  expect(from).toHaveBeenCalledWith('photos');
  expect(list).toHaveBeenCalledWith('anonymous', expect.any(Object));
});
