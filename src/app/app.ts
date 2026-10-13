
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Empresa, EmpresaService } from './services/empresa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private servicio = inject(EmpresaService);
  private detector = inject(ChangeDetectorRef);

  empresas: Empresa[] = [];

  vista: 'listado' | 'formulario' | 'detalle' = 'listado';
  modo: 'crear' | 'editar' = 'crear';

  empresaActual: Empresa = this.empresaVacia();

  mensaje = '';
  error = '';

  ngOnInit(): void {
    this.cargarEmpresas();
  }

  private empresaVacia(): Empresa {
    return {
      nombreComercial: '',
      razonSocial: '',
      telefono: '',
      correo: '',
      nit: '',
      estado: 'Activo',
      direccion: ''
    };
  }

  cargarEmpresas(): void {
    this.servicio.listar().subscribe({
      next: (datos) => {
        console.log('Empresas recibidas:', datos);
        console.log('¿Es un arreglo?', Array.isArray(datos));

        if (!Array.isArray(datos)) {
          this.empresas = [];
          this.error = 'La respuesta del servidor no tiene el formato esperado.';
        } else {
          this.empresas = datos;
          this.error = '';
        }

        console.log('Total asignado a Angular:', this.empresas.length);
        this.detector.detectChanges();
      },
      error: (respuesta) => {
        console.error('Error al cargar empresas:', respuesta);

        this.error = respuesta.error?.mensaje
          || 'No se pudieron cargar las empresas. Comprueba que el servidor esté funcionando.';

        this.detector.detectChanges();
      }
    });
  }

  nuevaEmpresa(): void {
    this.empresaActual = this.empresaVacia();
    this.modo = 'crear';
    this.vista = 'formulario';
    this.mensaje = '';
    this.error = '';
  }

  editarEmpresa(empresa: Empresa): void {
    this.empresaActual = { ...empresa };
    this.modo = 'editar';
    this.vista = 'formulario';
    this.mensaje = '';
    this.error = '';
  }

  verDetalle(empresa: Empresa): void {
    this.empresaActual = { ...empresa };
    this.vista = 'detalle';
    this.mensaje = '';
    this.error = '';
  }

  volverListado(): void {
    this.vista = 'listado';
    this.error = '';
    this.cargarEmpresas();
  }

  guardarEmpresa(): void {
    this.error = '';
    this.mensaje = '';

    const e = this.empresaActual;

    const obligatorios = [
      e.nombreComercial,
      e.razonSocial,
      e.telefono,
      e.nit,
      e.direccion
    ];

    if (obligatorios.some(campo => !campo?.trim())) {
      this.error = 'Completa todos los campos obligatorios.';
      return;
    }

    if (this.modo === 'crear') {
      if (!e.correo?.trim()) {
        this.error = 'El correo electrónico es obligatorio.';
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.correo.trim())) {
        this.error = 'Escribe un correo electrónico válido.';
        return;
      }
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(e.telefono.trim())) {
      this.error = 'El teléfono no tiene un formato válido.';
      return;
    }

    if (!/^[0-9-]{5,15}$/.test(e.nit.trim())) {
      this.error = 'El NIT debe contener entre 5 y 15 números, con guiones opcionales.';
      return;
    }

    if (this.modo === 'crear') {
      this.servicio.crear(e).subscribe({
        next: () => {
          this.mensaje = 'Empresa registrada correctamente.';
          this.vista = 'listado';
          this.cargarEmpresas();
        },
        error: (respuesta) => {
          this.error = respuesta.error?.mensaje
            || 'No se pudo registrar la empresa.';
        }
      });
    } else if (e.id !== undefined) {
      this.servicio.actualizar(e.id, e).subscribe({
        next: () => {
          this.mensaje = 'Empresa actualizada correctamente.';
          this.vista = 'listado';
          this.cargarEmpresas();
        },
        error: (respuesta) => {
          this.error = respuesta.error?.mensaje
            || 'No se pudo actualizar la empresa.';
        }
      });
    }
  }

  eliminarEmpresa(empresa: Empresa): void {
    if (empresa.id === undefined) {
      return;
    }

    const confirmar = confirm(
      `¿Seguro que deseas eliminar la empresa "${empresa.nombreComercial}"?`
    );

    if (!confirmar) {
      return;
    }

    this.error = '';
    this.mensaje = '';

    this.servicio.eliminar(empresa.id).subscribe({
      next: () => {
        this.mensaje = 'Empresa eliminada correctamente.';
        this.cargarEmpresas();
      },
      error: (respuesta) => {
        this.error = respuesta.error?.mensaje
          || 'No se pudo eliminar la empresa.';
      }
    });
  }
}
