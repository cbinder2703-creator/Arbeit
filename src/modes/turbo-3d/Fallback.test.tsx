import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Game from './Game';
import { makeProps, pick } from '@/test/harness';

describe('Turbo-Rennen 3D ohne WebGL', () => {
  it('zeigt eine freundliche Erklärung statt eines Fehlers', () => {
    const { props, onClose } = makeProps(pick('mc', 8, 1));
    render(<Game {...props} />);
    expect(screen.getByTestId('no-webgl')).toHaveTextContent('3D geht auf diesem Gerät nicht');
    fireEvent.click(screen.getByRole('button', { name: 'Zurück' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
