"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "default" }) {
  if (!isOpen) return null

  const getButtonStyle = (type) => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white"
      case "success":
        return "bg-green-600 hover:bg-green-700 text-white"
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white"
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex space-x-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 py-2"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`px-4 py-2 ${getButtonStyle(type)}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function useConfirmDialog() {
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "default"
  })

  const openDialog = ({ title, message, onConfirm, confirmText, cancelText, type }) => {
    setDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText: confirmText || "Confirm",
      cancelText: cancelText || "Cancel",
      type: type || "default"
    })
  }

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }))
  }

  const handleConfirm = () => {
    dialog.onConfirm()
    closeDialog()
  }

  return {
    dialog,
    openDialog,
    closeDialog,
    ConfirmDialog: () => (
      <ConfirmDialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        type={dialog.type}
      />
    )
  }
}
