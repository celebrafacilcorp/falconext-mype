import React, { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, type IAuthState } from '@/zustand/auth'
import Alert from '@/components/Alert'
import NotificacionesCampana from '@/components/NotificacionesCampana'
import { hasPermission, getRedirectPath } from '@/utils/permissions'
import Button from '@/components/Button'

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { auth }: IAuthState = useAuthStore()

  const [nameNavbar, setNameNavbar] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isFactSubmenuOpen, setIsFactSubmenuOpen] = useState(false)
  const [isContSubmenuOpen, setIsContSubmenuOpen] = useState(false)
  const [isKardexSubmenuOpen, setIsKardexSubmenuOpen] = useState(false)
  const [isCajaSubmenuOpen, setIsCajaSubmenuOpen] = useState(false)

  // Cerrar todos los acordeones
  const closeAllAccordions = () => {
    setIsFactSubmenuOpen(false)
    setIsContSubmenuOpen(false)
    setIsKardexSubmenuOpen(false)
    setIsCajaSubmenuOpen(false)
  }

  // Alternar acordeón exclusivo
  const toggleAccordion = (key: 'fact' | 'cont' | 'kardex' | 'caja') => {
    if (key === 'fact') {
      const next = !isFactSubmenuOpen
      closeAllAccordions()
      setIsFactSubmenuOpen(next)
    } else if (key === 'cont') {
      const next = !isContSubmenuOpen
      closeAllAccordions()
      setIsContSubmenuOpen(next)
    } else if (key === 'kardex') {
      const next = !isKardexSubmenuOpen
      closeAllAccordions()
      setIsKardexSubmenuOpen(next)
    } else if (key === 'caja') {
      const next = !isCajaSubmenuOpen
      closeAllAccordions()
      setIsCajaSubmenuOpen(next)
    }
  }

  useEffect(() => {
    if (location.pathname === '/administrador') setNameNavbar('Administrador')
    else if (location.pathname.startsWith('/administrador/')) {
      const name = location.pathname.replace('/administrador/', '')
      setNameNavbar(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }, [location.pathname])

  // Redireccionar a primer módulo permitido si no tiene acceso a dashboard
  useEffect(() => {
    if (!auth) return
    if (location.pathname === '/administrador' && !hasPermission(auth, 'dashboard')) {
      const path = getRedirectPath(auth, location.pathname)
      if (path && path !== location.pathname) {
        navigate(path, { replace: true })
      }
    }
  }, [auth, location.pathname, navigate])

  const logout = () => {
    localStorage.removeItem('ACCESS_TOKEN')
    localStorage.removeItem('REFRESH_TOKEN')
    navigate('/login', { replace: true })
  }

  console.log(auth)

  return (
    <div className="relative h-screen overflow-x-hidden md:overflow-auto">
      <Alert />
      <aside className={`bg-white p-5 space-y-4 fixed w-[260px] h-full overflow-y-auto ${isSidebarOpen ? 'z-1 w-full md:w-[260px] transition-all duration-300' : 'z-1 ml-[-260px] md:ml-0 transition-all duration-300'}`}>
        <h2 className="text-xl mb-10 font-bold flex items-center text-[#4d4d4d] ml-4.5">
          <img width={30} src="/logonephi.png" className="mr-2 ml-4 rounded-xl" alt="logo" />
          NEPHI
        </h2>
        <nav className="space-y-2">
          {auth?.rol === 'ADMIN_SISTEMA' && (
            <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/empresas" className={({ isActive }) => isActive || location.pathname.startsWith('/administrador/empresas') ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
              <Icon icon="mdi:company" className="mr-2" width="24" height="24" /> Empresas
            </NavLink>
          )}

          {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
            <>
              {/* Dashboard - disponible para todos los usuarios */}
              {hasPermission(auth, 'dashboard') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Administrador') }} to="/administrador" end className={({ isActive }) => isActive ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                  <Icon icon="basil:chart-pie-alt-outline" className="mr-2" width="24" height="24" /> Dashboard
                </NavLink>
              )}
              {/* Kardex */}
              {hasPermission(auth, 'kardex') && (
                <div>
                  <button onClick={() => { setIsSidebarOpen(false); toggleAccordion('kardex'); setNameNavbar('Kardex') }} className={location.pathname.includes('/administrador/kardex') ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl w-full text-left' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d] w-full text-left'}>
                    <Icon icon="basil:book-open-outline" className="mr-2" width="24" height="24" /> Kardex
                    <Icon icon={isKardexSubmenuOpen ? 'basil:caret-up-outline' : 'mdi:chevron-down'} className="ml-auto" width="20" />
                  </button>
                  {isKardexSubmenuOpen && (
                    <div className="ml-8 space-y-2 mt-2">
                      <NavLink to="/administrador/kardex/dashboard" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Dashboard
                      </NavLink>
                      <NavLink to="/administrador/kardex/productos" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Productos
                      </NavLink>
                      <NavLink to="/administrador/kardex" end className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Movimientos
                      </NavLink>
                    </div>
                  )}
                </div>
              )}

              {/* Clientes */}
              {hasPermission(auth, 'clientes') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Clientes') }} to="/administrador/clientes" className={({ isActive }) => isActive ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                  <Icon icon="basil:user-plus-outline" className="mr-2" width="24" height="24" /> Clientes
                </NavLink>
              )}

              {/* Comprobantes */}
              {hasPermission(auth, 'comprobantes') && (
                <>
                  {/* Facturación SUNAT - Solo para empresas formales */}
                  {auth?.empresa?.tipoEmpresa === 'FORMAL' && (
                    <div>
                      <button onClick={() => { setIsSidebarOpen(false); toggleAccordion('fact'); setNameNavbar('Facturacion') }} className={location.pathname.includes('/administrador/facturacion') ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl w-full text-left' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d] w-full text-left'}>
                        <Icon icon="basil:file-outline" className="mr-2" width="24" height="24" /> Fact. SUNAT
                        <Icon icon={isFactSubmenuOpen ? 'basil:caret-up-outline' : 'basil:caret-down-solid'} className="ml-auto" width="20" />
                      </button>
                      {isFactSubmenuOpen && (
                        <div className="ml-8 space-y-2 mt-2">
                          <NavLink to="/administrador/facturacion/comprobantes" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                            Comprobantes SUNAT
                          </NavLink>
                          <NavLink to="/administrador/facturacion/nuevo" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                            Crear comprobantes
                          </NavLink>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comprobantes informales - Para empresas informales */}
                  {(auth?.empresa?.tipoEmpresa === 'FORMAL' || auth?.empresa?.tipoEmpresa === 'INFORMAL') && (
                    <div>
                      <button onClick={() => { setIsSidebarOpen(false); toggleAccordion('fact'); setNameNavbar('Comprobantes Informales') }} className={location.pathname.includes('/administrador/facturacion/comprobantes-informales') ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl w-full text-left' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d] w-full text-left'}>
                        <Icon icon="raphael:paper" className="mr-2" width="24" height="24" /> Notas de Pedido
                        <Icon icon={isFactSubmenuOpen ? 'basil:caret-up-outline' : 'basil:caret-down-solid'} className="ml-auto" width="20" />
                      </button>
                      {isFactSubmenuOpen && (
                        <div className="ml-8 space-y-2 mt-2">
                          <NavLink to="/administrador/facturacion/comprobantes-informales" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                            Notas de ventas
                          </NavLink>
                          {
                            auth?.empresa?.tipoEmpresa === 'INFORMAL' && (
                              <NavLink to="/administrador/facturacion/nuevo" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                                Crear comprobantes
                              </NavLink>
                            )
                          }
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pagos - visible si tiene permiso 'pagos' */}
              {hasPermission(auth, 'pagos') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Pagos') }} to="/administrador/pagos" className={({ isActive }) => isActive ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                  <Icon icon="hugeicons:money-bag-01" className="mr-2" width="24" height="24" /> Gestión de Pagos
                </NavLink>
              )}
                </>
              )}
              {/* Reportes/Contabilidad */}
              {hasPermission(auth, 'reportes') && (
                <div>
                  <button onClick={() => { setIsSidebarOpen(false); toggleAccordion('cont'); setNameNavbar('Contabilidad') }} className={location.pathname.includes('/administrador/contabilidad') ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl w-full text-left' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d] w-full text-left'}>
                    <Icon icon="solar:calculator-linear" className="mr-2" width="24" height="24" /> Contabilidad
                    <Icon icon={isContSubmenuOpen ? 'basil:caret-up-outline' : 'basil:caret-down-solid'} className="ml-auto" width="20" />
                  </button>
                  {isContSubmenuOpen && (
                    <div className="ml-8 space-y-2 mt-2">
                      {auth?.empresa?.tipoEmpresa === 'FORMAL' && (
                        <NavLink to="/administrador/contabilidad/reporte" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                          Reporte Formales (SUNAT)
                        </NavLink>
                      )}
                      {auth?.empresa?.tipoEmpresa === 'INFORMAL' && (
                        <NavLink to="/administrador/contabilidad/reporte-informales" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                          Reporte Informales
                        </NavLink>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Caja - visible si tiene permiso 'caja' */}
              {hasPermission(auth, 'caja') && (
                <div>
                  <button onClick={() => { setIsSidebarOpen(false); toggleAccordion('caja'); setNameNavbar('Caja') }} className={location.pathname.includes('/administrador/caja') ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl w-full text-left' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d] w-full text-left'}>
                    <Icon icon="hugeicons:atm-01" className="mr-2" width="24" height="24" /> Caja
                    <Icon icon={isCajaSubmenuOpen ? 'basil:caret-up-outline' : 'basil:caret-down-solid'} className="ml-auto" width="20" />
                  </button>
                  {isCajaSubmenuOpen && (
                    <div className="ml-8 space-y-2 mt-2">
                      <NavLink to="/administrador/caja" end className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Dashboard
                      </NavLink>
                      <NavLink to="/administrador/caja/historial" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Historial
                      </NavLink>
                      <NavLink to="/administrador/caja/arqueo" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Arqueo
                      </NavLink>
                      <NavLink to="/administrador/caja/reporte-turno" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Reporte de Turno
                      </NavLink>
                      <NavLink to="/administrador/caja/reporte-usuarios" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Reporte de Usuarios
                      </NavLink>
                    </div>
                  )}
                </div>
              )}

              {/* Usuarios - Solo para Administradores */}
              {hasPermission(auth, 'usuarios') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Usuarios') }} to="/administrador/usuarios" className={({ isActive }) => isActive ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                  <Icon icon="solar:user-broken" className="mr-2" width="24" height="24" /> Usuarios
                </NavLink>
              )}

              {/* Notificaciones - Para usuarios de empresa */}
              {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Notificaciones') }} to="/administrador/notificaciones" className={({ isActive }) => isActive ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                  <Icon icon="basil:notification-outline" className="mr-2" width="24" height="24" /> Notificaciones
                </NavLink>
              )}

              {/* Perfil - disponible para todos */}
              <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Perfil') }} to="/administrador/perfil" className={({ isActive }) => isActive ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                <Icon icon="solar:user-circle-broken" className="mr-2" width="24" height="24" /> Perfil
              </NavLink>
            </>
          )}
        </nav>
        <button className="md:hidden fixed top-0 right-8 z-[999] p-2 bg-gray-900 text-white rounded-xl shadow-md" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Icon icon="mdi:menu" width="24" />
        </button>
      </aside>

      <main className={`flex-1 mt-16 h-full md:mt-0 relative w-full transition-all duration-300 bg-[#F3F4F6] ${isSidebarOpen ? 'md:ml-0 ml-[0px] pl-[260px]' : 'ml-0 px-3 md:px-0 md:pl-[260px]'} md:ml-[0px]`}>
        <div className="bg-white p-3 px-5 mt-5 md:ml-8 mb-5 md:mb-0 md:mr-8 flex justify-between items-center rounded-xl">
          <h2 className="font-bold">{nameNavbar}</h2>
          <div className="flex items-center gap-3">
            <div onClick={logout} className="flex cursor-pointer items-center p-2 rounded-full">
              <Button color="danger" onClick={logout}>
                Cerrar sesión
              </Button>
            </div>
            {/* Notificaciones */}
            {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
              <NotificacionesCampana />
            )}
            
            <div className="mr-2 hidden md:block">
              <img width={30} height={30} src={auth?.empresa?.logo || 'https://icons.veryicon.com/png/o/miscellaneous/two-color-icon-library/user-286.png'} alt="" />
            </div>
            <div>
              <label className="hidden md:block font-medium">{auth?.nombre}</label>
              <p className="text-[12px]">{auth?.empresa?.nombreComercial}</p>
            </div>
            
          </div>
        </div>
        <div className="bg-[#F3F4F6]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
