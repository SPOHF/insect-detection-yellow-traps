import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FieldMapManager from '../FieldMapManager';

const getMock = vi.fn();

vi.mock('../../api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('leaflet', () => {
  const proto = {};
  return {
    default: {
      divIcon: vi.fn(() => ({})),
      Icon: {
        Default: Object.assign(function Default() {}, { mergeOptions: vi.fn() }),
      },
    },
  };
});

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  Marker: ({
    children,
    eventHandlers,
  }: {
    children: React.ReactNode;
    eventHandlers?: { click?: () => void };
  }) => (
    <button data-testid="marker" onClick={() => eventHandlers?.click?.()}>
      marker
      {children}
    </button>
  ),
  Polygon: () => <div>polygon</div>,
  Polyline: () => <div>polyline</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TileLayer: () => <div>tile</div>,
  useMap: () => ({ setView: vi.fn() }),
  useMapEvents: () => ({}),
}));

describe('FieldMapManager', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('loads fields and allows selecting trap from map marker', async () => {
    const onTrapSelect = vi.fn();
    getMock.mockImplementation((path: string) => {
      if (path === '/api/map/fields') {
        return Promise.resolve([{ id: 'field-1', name: 'Field A', area_m2: 1000, trap_count: 1 }]);
      }
      if (path === '/api/map/fields/field-1') {
        return Promise.resolve({
          id: 'field-1',
          name: 'Field A',
          area_m2: 1000,
          polygon: [
            { lat: 52.0, lng: 5.0 },
            { lat: 52.01, lng: 5.0 },
            { lat: 52.01, lng: 5.01 },
          ],
          traps: [{ id: 'trap-1', code: 'R01-P01', name: 'R01-P01', lat: 52.005, lng: 5.005, row_index: 1, position_index: 1 }],
        });
      }
      return Promise.resolve([]);
    });

    render(
      <FieldMapManager
        token="token"
        selectedTrapId=""
        uploadOnly={true}
        onTrapSelect={onTrapSelect}
      />
    );

    await waitFor(() => expect(getMock).toHaveBeenCalledWith('/api/map/fields', 'token'));
    await waitFor(() => expect(getMock).toHaveBeenCalledWith('/api/map/fields/field-1', 'token'));
    expect(screen.getByText(/Select an existing field and trap marker/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId('marker')[0]);
    expect(onTrapSelect).toHaveBeenCalled();
  });
});
