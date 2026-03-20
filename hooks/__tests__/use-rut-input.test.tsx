import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRutInput } from "../use-rut-input";

describe("useRutInput", () => {
  it("debe iniciar con valor vacío por defecto", () => {
    const { result } = renderHook(() => useRutInput());
    expect(result.current.formattedValue).toBe("");
    expect(result.current.cleanValue).toBe("");
    expect(result.current.isValid).toBe(false);
  });

  it("debe formatear initialValue", () => {
    const { result } = renderHook(() =>
      useRutInput({ initialValue: "123456785" })
    );
    expect(result.current.formattedValue).toMatch(/12\.345\.678-5/);
    expect(result.current.isValid).toBe(true);
  });

  it("debe formatear al cambiar con formatOnChange=true (default)", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useRutInput({ onChange }));

    act(() => {
      result.current.inputProps.onChange({
        target: { value: "123456785" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formattedValue).toMatch(/12\.345\.678-5/);
    expect(onChange).toHaveBeenCalledWith("123456785");
  });

  it("debe NO formatear al cambiar con formatOnChange=false", () => {
    const { result } = renderHook(() =>
      useRutInput({ formatOnChange: false })
    );

    act(() => {
      result.current.inputProps.onChange({
        target: { value: "12345678-5" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // No debería agregar puntos mientras escribe
    expect(result.current.formattedValue).toBe("12345678-5");
  });

  it("debe formatear en blur siempre", () => {
    const { result } = renderHook(() =>
      useRutInput({ formatOnChange: false })
    );

    act(() => {
      result.current.inputProps.onChange({
        target: { value: "123456785" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.inputProps.onBlur();
    });

    expect(result.current.formattedValue).toMatch(/12\.345\.678-5/);
  });

  it("debe validar RUT correcto como válido", () => {
    const { result } = renderHook(() =>
      useRutInput({ initialValue: "12.345.678-5" })
    );
    expect(result.current.isValid).toBe(true);
  });

  it("debe validar RUT incorrecto como inválido", () => {
    const { result } = renderHook(() =>
      useRutInput({ initialValue: "12.345.678-0" })
    );
    expect(result.current.isValid).toBe(false);
  });

  it("debe setear valor programáticamente con setValue", () => {
    const { result } = renderHook(() => useRutInput());

    act(() => {
      result.current.setValue("123456785");
    });

    expect(result.current.formattedValue).toMatch(/12\.345\.678-5/);
    expect(result.current.isValid).toBe(true);
  });

  it("debe limpiar con clear", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useRutInput({ initialValue: "123456785", onChange })
    );

    act(() => {
      result.current.clear();
    });

    expect(result.current.formattedValue).toBe("");
    expect(result.current.cleanValue).toBe("");
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("debe sanitizar caracteres no permitidos", () => {
    const { result } = renderHook(() => useRutInput());

    act(() => {
      result.current.inputProps.onChange({
        target: { value: "12abc345" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Solo números, puntos, guiones y K deben pasar
    expect(result.current.cleanValue).not.toMatch(/[a-jl-z]/i);
  });

  it("debe retornar inputProps con value, onChange y onBlur", () => {
    const { result } = renderHook(() => useRutInput());
    expect(result.current.inputProps).toHaveProperty("value");
    expect(result.current.inputProps).toHaveProperty("onChange");
    expect(result.current.inputProps).toHaveProperty("onBlur");
  });
});
