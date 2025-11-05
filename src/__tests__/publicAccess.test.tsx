import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Templates from '../pages/Templates';
import UploadPhoto from '../components/UploadPhoto';
import PhotoGallery from '../components/PhotoGallery';
import { getSupabase } from '../lib/supabaseClient';

jest.mock('../lib/supabaseClient', () => ({
  getSupabase: jest.fn(),
}));

const mockGetSupabase = getSupabase as jest.MockedFunction<typeof getSupabase>;

afterEach(() => {
  jest.resetAllMocks();
});

function createTemplatesClient(result: { data: unknown; error: unknown }) {
  return {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve(result)),
          })),
        })),
      })),
    })),
  };
}

test('Templates renders public rows from Supabase', async () => {
  const supabase = createTemplatesClient({
    data: [{ id: '1', name: 'Welcome Template', description: 'Sample', is_public: true }],
    error: null,
  });

  mockGetSupabase.mockReturnValue(supabase as any);

  render(<Templates />);

  await waitFor(() => {
    expect(screen.getByText('Welcome Template')).toBeInTheDocument();
  });
  expect(screen.getByText('Sample')).toBeInTheDocument();
  expect(supabase.from).toHaveBeenCalledWith('templates');
});

test('Templates shows empty state when no rows are returned', async () => {
  const supabase = createTemplatesClient({ data: [], error: null });
  mockGetSupabase.mockReturnValue(supabase as any);

  render(<Templates />);

  await waitFor(() => {
    expect(screen.getByText('No public templates yet.')).toBeInTheDocument();
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

    mockGetSupabase.mockReturnValue({
      storage: { from },
    } as any);

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
    expect(pathArg).toMatch(/^public\/.*\.png$/);
    expect(fileArg).toBe(file);
    expect(optionsArg).toMatchObject({ upsert: false, cacheControl: '3600' });
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
  const getPublicUrl = jest.fn().mockReturnValue({
    data: { publicUrl: 'https://cdn.example.com/public/demo.png' },
  });
  const from = jest.fn(() => ({
    list,
    getPublicUrl,
  }));

  mockGetSupabase.mockReturnValue({
    storage: { from },
  } as any);

  render(<PhotoGallery />);

  await waitFor(() => {
    expect(screen.getByAltText('demo.png')).toBeInTheDocument();
  });

  expect(from).toHaveBeenCalledWith('photos');
  expect(list).toHaveBeenCalledWith('public', expect.any(Object));
});
